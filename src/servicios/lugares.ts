import type { Lugar } from "../tipos/entities";
import { lugaresMock } from "../mocks/lugares";

export async function obtenerLugares(): Promise<Lugar[]> {
 return lugaresMock;
}