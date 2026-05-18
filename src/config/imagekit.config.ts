type ImageKitConfig = {
  publicKey?: string;
  privateKey?: string;
  urlEndpoint?: string;
};

try {
  process.loadEnvFile();
} catch (error) {
  const envError = error as NodeJS.ErrnoException;

  if (envError.code !== "ENOENT") {
    throw error;
  }
}

const imageKitConfig: ImageKitConfig = {
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
};

export default imageKitConfig;
