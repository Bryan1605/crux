import doctrina from '../../content/apologetica/shincheonji-doctrina.json';
import ApologeticaDoctrina from './ApologeticaDoctrina';

/*
 * Pestaña «¿Qué cree Shincheonji?» de /apologetica/shincheonji.
 * Envuelve el componente compartido ApologeticaDoctrina manteniendo las citas
 * bilingües verificadas de Lee Man-hee.
 */
export default function ShincheonjiDoctrina() {
  return <ApologeticaDoctrina doctrina={doctrina} />;
}
