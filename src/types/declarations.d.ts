// Declaración de tipos para módulos CSS y Tailwind
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Declaraciones para imágenes y otros archivos estáticos
declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}