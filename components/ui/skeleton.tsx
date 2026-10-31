export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Placeholder de carga único de la app.
 * Usa el mismo brillo `ignite-shimmer` que las portadas, en lugar del pulso,
 * para que no convivan dos estilos de skeleton distintos en la misma pantalla.
 */
export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div aria-hidden="true" style={style} className={`ignite-shimmer rounded-xl ${className}`} />;
}
