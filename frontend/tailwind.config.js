/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#09090b",
                foreground: "#fafafa",
                primary: "#3b82f6",
                secondary: "#a1a1aa",
                accent: "#8b5cf6",
                success: "#22c55e",
                error: "#ef4444",
                card: "#18181b",
                "card-hover": "#27272a",
                border: "#27272a"
            },
            fontFamily: {
                mono: ['"Fira Code"', 'monospace'],
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
