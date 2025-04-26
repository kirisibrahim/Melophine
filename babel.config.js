module.exports = function (api) {
    api.cache(true);
    return {
      presets: [
        ["babel-preset-expo", { jsxImportSource: "nativewind" }], // JSX için NativeWind desteği
        "nativewind/babel",
      ],
    };
  };