import tailwindConfig from "./tailwind.config.ts";

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      config: tailwindConfig,
    },
  },
};

export default config;
