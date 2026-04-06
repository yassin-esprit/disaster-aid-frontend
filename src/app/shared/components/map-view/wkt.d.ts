// src/app/shared/components/map-view/wkt.d.ts
declare module 'wkt' {
  interface WKT {
    parse(wkt: string): any;
    stringify(geom: any): string;
  }
  const wkt: WKT;
  export default wkt;
}
