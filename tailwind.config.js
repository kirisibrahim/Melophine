/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")], // NativeWind için preset ekleniyor
  theme: {
    extend: {},
  },
  plugins: [],
};