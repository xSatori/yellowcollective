import Layout from "@/components/Layout";
import type {
  PlaygroundArtwork,
  PlaygroundImage,
} from "data/nouns-builder/artwork";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

type GeneratedToken = {
  id: string;
  layers: PlaygroundImage[];
};

const RANDOM_VALUE = "random";
const fixedRenderTraits = new Set(["glasses"]);

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load artwork.");
  }

  return data;
};

const getTraitImage = (
  images: PlaygroundImage[],
  trait: string,
  selectedName?: string
) =>
  images.find((image) => image.trait === trait && image.name === selectedName);

const getRandomItem = <T,>(items: T[]) =>
  items[Math.floor(Math.random() * items.length)];

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${src}`));
    image.src = src;
  });

const downloadUrl = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const getLayerDataUri = async (src: string) => {
  const response = await fetch(src);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Unable to read ${src}`));
    reader.readAsDataURL(blob);
  });
};

const getDownloadFileName = (generation: GeneratedToken, extension: string) =>
  `yellow-${generation.id}.${extension}`;

export default function PlaygroundPage() {
  const { data, error, isLoading } = useSWR<PlaygroundArtwork>(
    "/api/playground/artwork",
    fetcher
  );
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string>>(
    {}
  );
  const [gallery, setGallery] = useState<GeneratedToken[]>([]);
  const [selectedGeneration, setSelectedGeneration] =
    useState<GeneratedToken | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const controlLayers = useMemo(() => {
    if (!data) return [];

    return data.orderedLayers.filter(
      (layer) => !fixedRenderTraits.has(layer.trait.toLowerCase())
    );
  }, [data]);

  useEffect(() => {
    if (!data || Object.keys(selectedTraits).length) return;

    setSelectedTraits(
      Object.fromEntries(
        data.orderedLayers.map((layer) => [layer.trait, RANDOM_VALUE])
      )
    );
  }, [data, selectedTraits]);

  const updateTrait = (trait: string, value: string) => {
    setSelectedTraits((currentTraits) => ({
      ...currentTraits,
      [trait]: value,
    }));
  };
  const resolveLayers = () => {
    if (!data) return [];

    const renderTraits = [...data.renderLayers];

    data.orderedLayers.forEach((layer) => {
      if (
        fixedRenderTraits.has(layer.trait.toLowerCase()) &&
        !renderTraits.includes(layer.trait)
      ) {
        renderTraits.push(layer.trait);
      }
    });

    return renderTraits
      .map((trait) => {
        const layer = data.orderedLayers.find((item) => item.trait === trait);
        if (!layer) return undefined;

        if (fixedRenderTraits.has(trait.toLowerCase())) {
          return getTraitImage(data.images, trait, layer.properties[0]);
        }

        const selectedName = selectedTraits[trait];
        const resolvedName =
          !selectedName || selectedName === RANDOM_VALUE
            ? getRandomItem(layer.properties)
            : selectedName;

        return getTraitImage(data.images, trait, resolvedName);
      })
      .filter((image): image is PlaygroundImage => Boolean(image));
  };
  const generate = () => {
    const layers = resolveLayers();
    if (!layers.length) return;

    const generation = {
      id: `${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      layers,
    };

    setGallery((currentGallery) => [generation, ...currentGallery]);
  };
  const downloadPng = async (generation: GeneratedToken) => {
    setDownloadError("");

    try {
      const loadedLayers = await Promise.all(
        generation.layers.map((layer) => loadImage(layer.uri))
      );
      const size = loadedLayers[0]?.naturalWidth || 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to create canvas.");

      loadedLayers.forEach((image) => {
        context.drawImage(image, 0, 0, size, size);
      });

      downloadUrl(
        canvas.toDataURL("image/png"),
        getDownloadFileName(generation, "png")
      );
    } catch (downloadError) {
      setDownloadError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download PNG."
      );
    }
  };
  const downloadSvg = async (generation: GeneratedToken) => {
    setDownloadError("");

    try {
      const embeddedLayers = await Promise.all(
        generation.layers.map(async (layer) => ({
          ...layer,
          dataUri: await getLayerDataUri(layer.uri),
        }))
      );
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${embeddedLayers
        .map(
          (layer) =>
            `<image href="${layer.dataUri}" x="0" y="0" width="1024" height="1024" preserveAspectRatio="xMidYMid meet"><title>${layer.trait}: ${layer.name}</title></image>`
        )
        .join("")}</svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      downloadUrl(url, getDownloadFileName(generation, "svg"));
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setDownloadError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download SVG."
      );
    }
  };

  return (
    <Layout>
      <Head>
        <title>Playground | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 pb-12">
        <section className="rounded-2xl border border-skin-stroke bg-white p-6 shadow-sm md:p-8">
          <h1 className="font-heading text-[42px] leading-none text-skin-base md:text-[56px]">
            Playground
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-snug text-secondary md:text-lg">
            Generate combinations from the Yellow Collective onchain artwork.
          </p>
        </section>

        {isLoading && (
          <section className="rounded-2xl border border-skin-stroke bg-white p-6 text-secondary shadow-sm md:p-8">
            Loading artwork...
          </section>
        )}

        {error && (
          <section className="rounded-2xl border border-skin-stroke bg-white p-6 text-skin-proposal-danger shadow-sm md:p-8">
            {error.message}
          </section>
        )}

        {data && (
          <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="h-fit rounded-2xl border border-skin-stroke bg-white p-5 shadow-sm">
              <div className="font-heading text-2xl text-skin-base">Traits</div>
              <div className="mt-5 flex flex-col gap-4">
                {controlLayers.map((layer) => (
                  <label key={layer.trait} className="block">
                    <span className="font-heading text-base capitalize text-skin-base">
                      {layer.trait}
                    </span>
                    <select
                      value={selectedTraits[layer.trait] || RANDOM_VALUE}
                      onChange={(event) =>
                        updateTrait(layer.trait, event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-skin-stroke bg-skin-muted px-4 py-3 text-base text-skin-base focus:outline-none focus:ring-2 focus:ring-skin-highlighted"
                    >
                      <option value={RANDOM_VALUE}>Random</option>
                      {layer.properties.map((property) => (
                        <option key={property} value={property}>
                          {property}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={generate}
                className="mt-6 flex w-full items-center justify-center rounded-[18px] bg-accent px-5 py-3 font-heading text-lg text-skin-base shadow-[0px_4.02px_0px_0px_#b89400] transition hover:-translate-y-0.5 hover:bg-[#ffd84d] hover:shadow-[0px_6px_0px_0px_#b89400] active:translate-y-1 active:shadow-none"
              >
                Generate Yellow
              </button>
            </div>

            <div className="rounded-2xl border border-skin-stroke bg-white p-5 shadow-sm md:p-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="font-heading text-2xl text-skin-base">
                  Gallery
                </div>
                <div className="text-sm text-secondary">
                  {gallery.length} generated
                </div>
              </div>

              {gallery.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-skin-stroke bg-skin-muted p-6 text-center text-secondary">
                  Generate artwork to add it here.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {gallery.map((generation) => (
                    <button
                      key={generation.id}
                      type="button"
                      onClick={() => setSelectedGeneration(generation)}
                      className="group overflow-hidden rounded-2xl border border-skin-stroke bg-[#ffcc00] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <LayerStack layers={generation.layers} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {selectedGeneration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setSelectedGeneration(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-skin-stroke bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <LayerStack layers={selectedGeneration.layers} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => downloadPng(selectedGeneration)}
                className="rounded-[18px] bg-accent px-5 py-3 font-heading text-lg text-skin-base shadow-[0px_4.02px_0px_0px_#b89400] transition hover:-translate-y-0.5 hover:bg-[#ffd84d] hover:shadow-[0px_6px_0px_0px_#b89400] active:translate-y-1 active:shadow-none"
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={() => downloadSvg(selectedGeneration)}
                className="rounded-[18px] border border-skin-stroke bg-white px-5 py-3 font-heading text-lg text-skin-base shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none"
              >
                Download SVG
              </button>
            </div>
            {downloadError && (
              <p className="mt-4 rounded-xl border border-skin-proposal-danger bg-skin-proposal-danger bg-opacity-10 p-3 text-sm text-skin-proposal-danger">
                {downloadError}
              </p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

const LayerStack = ({ layers }: { layers: PlaygroundImage[] }) => (
  <div className="aspect-square w-full overflow-hidden rounded-2xl">
    <div className="relative h-full w-full">
      {layers.map((image) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${image.trait}-${image.name}`}
          src={image.uri}
          alt={`${image.trait} ${image.name}`}
          className="absolute inset-0 h-full w-full object-contain"
        />
      ))}
    </div>
  </div>
);
