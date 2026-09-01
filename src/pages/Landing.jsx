import Categories from '../components/landing/Categories';
import ClosingCta from '../components/landing/ClosingCta';
import Contact from '../components/landing/Contact';
import Faq from '../components/landing/Faq';
import Hero from '../components/landing/Hero';
import House from '../components/landing/House';
import Ieshive from '../components/landing/Ieshive';
import LandingFooter from '../components/landing/LandingFooter';
import LandingNav from '../components/landing/LandingNav';
import MoreAndStaff from '../components/landing/MoreAndStaff';
import Week from '../components/landing/Week';

/**
 * La vitrina pública de Malka, en `/`.
 *
 * Reemplaza a casamalka.org como puerta de entrada. Va sin `AppShell`: el
 * shell es el mueble de adentro (sidebar, sesión, notificaciones) y acá
 * todavía no hay nadie adentro.
 *
 * El orden del scroll cuenta una historia y no es casual:
 *
 *   quién somos (hero) → cuándo (la semana) → qué (lo que cambia) →
 *   dónde (la casa, La Ieshive, la terraza) → con quién (staff) →
 *   dudas (preguntas) → cómo llego (contacto) → entrá (cierre).
 *
 * El crema de marca sostiene toda la página y tres bandas oscuras a sangre le
 * marcan el compás: la de lo que cambia, la de La Ieshive y la del cierre.
 * Cada una cae justo donde hace falta pedir algo.
 *
 * La familia se declara una sola vez, acá: adentro de la app manda Cormorant
 * y afuera manda la grotesca, y esta es la frontera entre las dos.
 */
const Landing = () => (
  <div className="bg-surface-page font-grotesk">
    <LandingNav />
    <main>
      <Hero />
      <Week />
      <Categories />
      <House />
      <Ieshive />
      <MoreAndStaff />
      <Faq />
      <Contact />
      <ClosingCta />
    </main>
    <LandingFooter />
  </div>
);

export default Landing;
