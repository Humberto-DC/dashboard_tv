/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{ts,tsx,js,jsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            colors: {
                brand: {
                    green: "#2ecc71",
                    yellow: "#f1c40f",
                    red: "#e74c3c",
                    blue: "#3498db",
                    purple: "#9b59b6",
                    dark: "#0d1117",
                    panel: "#161b22",
                    border: "#30363d",
                    text: "#c9d1d9",
                    muted: "#8b949e",
                },
            },
            animation: {
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
        },
    },
    plugins: [],
};
