export function clientToViewBox(
  event: React.MouseEvent<SVGSVGElement>,
  svgElement: SVGSVGElement
): { x: number; y: number } {
  const point = svgElement.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const ctm = svgElement.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const svgPoint = point.matrixTransform(ctm.inverse());
  return { x: Math.round(svgPoint.x), y: Math.round(svgPoint.y) };
}
