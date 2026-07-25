// Next.js no declara módulos ambient para imports de CSS "planos" (solo para *.module.css
// vía CSS Modules). Sin esto, `import "./globals.css"` en app/layout.tsx no tipa bajo tsc
// standalone ni en el servidor de TypeScript del editor, aunque `next build` lo acepte
// porque su propio chequeo de tipos es más permisivo con este import.
declare module "*.css";
