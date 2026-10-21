/* Decide si el hero usa el video de Higgsfield o la escena HTML. */
export function shouldUseHeroVideo({ mp4, webm, isDesktop, saveData, reducedMotion }) {
  return Boolean((mp4 || webm) && isDesktop && !saveData && !reducedMotion);
}
