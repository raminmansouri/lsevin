// Run at image build time: downloads the model into MODEL_CACHE_DIR and proves it loads and answers.
import { env, pipeline } from "@huggingface/transformers";

env.cacheDir = process.env.MODEL_CACHE_DIR ?? "./.model-cache";
const model = process.env.EMBEDDING_MODEL ?? "Xenova/multilingual-e5-small";

const extractor = await pipeline("feature-extraction", model, { dtype: "q8" });
const out = await extractor(["query: کاشت مو قیطریه تهران"], {
  pooling: "mean",
  normalize: true,
});
if (out.dims[1] !== 384)
  throw new Error(`unexpected embedding size ${out.dims.join("x")}`);
console.log(`model ${model} ready (${out.dims[1]} dims) in ${env.cacheDir}`);
