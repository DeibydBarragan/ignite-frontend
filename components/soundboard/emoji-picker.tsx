"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { SmilePlus, Ban, Search, X } from "lucide-react";

export interface EmojiGroup {
  id: string;
  label: string;
  icon: string;
  emojis: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: "memes",
    label: "Memes & Risas",
    icon: "😂",
    emojis: [
      "😂", "🤣", "💀", "☠️", "🤡", "🗿", "🤓", "😎", "🤑", "🤠",
      "🥳", "🤪", "😜", "😈", "👿", "👻", "👽", "🤖", "💩", "👶",
      "🤦", "🤷", "🤨", "🧐", "🤫", "🤐", "🤥", "🙄", "😬", "🥱",
      "😴", "🤢", "🤮", "🥵", "🥶", "😱", "🤯", "🤬", "😡", "😭",
      "🥺", "😳", "🌚", "🌝", "🫠", "🫣", "🫡", "🫢", "🤤", "😵‍💫",
    ],
  },
  {
    id: "gestures",
    label: "Gestos & Reacciones",
    icon: "👍",
    emojis: [
      "👍", "👎", "👏", "🙌", "🤝", "👊", "✊", "🤛", "🤜", "🤞",
      "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇",
      "✋", "👋", "🤙", "💪", "🖕", "🧠", "👀", "👁️", "👅", "👄",
      "💋", "❤️", "💔", "🔥", "✨", "⭐", "🎉", "💯", "🙏", "🫂",
      "🫀", "🫁", "🫵", "🫶", "🫰", "💅", "💃", "🕺", "🕴️", "🙆",
    ],
  },
  {
    id: "audio",
    label: "Sonidos & Música",
    icon: "📢",
    emojis: [
      "📢", "📣", "🔔", "🔕", "🔊", "🔉", "🔈", "🔇", "🎙️", "📻",
      "🎧", "🎼", "🎵", "🎶", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕",
      "🎻", "🪗", "📯", "🎤", "💿", "📀", "📼", "📡", "⚡", "💥",
      "💣", "⏰", "⏱️", "⏳", "🎛️", "🎚️", "🎬", "📺", "📻", "🎙️",
    ],
  },
  {
    id: "gaming",
    label: "Gaming & Anime",
    icon: "🎮",
    emojis: [
      "🎮", "🕹️", "👾", "🎯", "🎲", "🎰", "🎳", "🏆", "🥇", "🥈",
      "🥉", "👑", "⚔️", "🗡️", "🛡️", "🏹", "🪄", "🧙", "🧝", "🧛",
      "🧟", "🦸", "🦹", "🥷", "💢", "💫", "💨", "🩸", "🪙", "💎",
      "🔮", "🧿", "🪓", "🔫", "🥋", "🛹", "⛸️", "🥊", "🧗", "🤺",
    ],
  },
  {
    id: "alerts",
    label: "Peligro & Alertas",
    icon: "🚨",
    emojis: [
      "🚨", "⚠️", "⛔", "🚫", "🛑", "☢️", "☣️", "🆘", "❌", "⭕",
      "❗", "❓", "‼️", "⁉️", "🧨", "💥", "🔥", "🌪️", "🌊", "❄️",
      "🧪", "💉", "💊", "🩹", "🩼", "🪦", "🚓", "🚑", "🚒", "🛸",
      "🚀", "⚡", "🌋", "☄️", "🔥", "🧯", "🪓", "🪜", "🚧", "⚓",
    ],
  },
  {
    id: "animals",
    label: "Animales & Naturaleza",
    icon: "🦁",
    emojis: [
      "🦆", "🐱", "🐶", "🐺", "🦊", "🦝", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧",
      "🐦", "🐤", "🦅", "🦉", "🦇", "🐝", "🐛", "🦋", "🐌", "🐞",
      "🐜", "🦟", "🦗", "🕷️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕",
      "🐙", "🦑", "🦐", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🦈",
      "🐊", "🦓", "🦍", "🐘", "🦛", "🦏", "🐪", "🦒", "🦘", "🐎",
      "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐈", "🐓", "🦃", "🦚",
      "🦜", "🦢", "🦩", "🕊️", "🐇", "🐀", "🐿️", "🦔", "🐉", "🦄",
    ],
  },
  {
    id: "party",
    label: "Fiesta, Comida & Objetos",
    icon: "🎉",
    emojis: [
      "🍕", "🍔", "🍟", "🌭", "🍿", "🥓", "🧇", "🥞", "🧀", "🌮",
      "🌯", "🍜", "🍣", "🍦", "🍩", "🍪", "🎂", "🍰", "🧁", "🍫",
      "🍬", "🍭", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🍾",
      "🧃", "☕", "🎉", "🎊", "🎈", "🎁", "🪅", "🎃", "🎆", "🎇",
      "💵", "💰", "🚽", "🪠", "🪤", "🪣", "🚪", "🪑", "🧻", "🧼",
    ],
  },
];

const EMOJI_KEYWORDS: Record<string, string> = {
  "😂": "risa reir jaja laugh lol meme gracioso cara humor",
  "🤣": "risa reir rofl carcajada meme suelo muerto",
  "💀": "skull calavera muerto dead mori moricion meme esqueleto",
  "☠️": "pirata veneno peligro muerte calavera",
  "🤡": "payaso clown circo meme bobo tonto",
  "🗿": "moai chad sigma piedra estatua meme basado gigachad",
  "🤓": "nerd nerdo gafas inteligente cuatrojos empollon",
  "😎": "cool gafas lentes facha fachero pro capo",
  "🤑": "dinero plata cash rico money billete dolar",
  "🤠": "vaquero cowboy sheriff sombrero oeste",
  "🥳": "fiesta party cumple celebracion festejo",
  "🤪": "loco crazy broma risa descontrol",
  "😈": "diablo demonio devil malo travesura sonrisita",
  "👻": "fantasma ghost susto boo espanto",
  "💩": "caca popo mierda poop meme bano",
  "👶": "bebe baby nino criatura",
  "🤦": "facepalm pena mano cara verguenza cringe",
  "🤷": "shrug encoger hombros que se yo me da igual",
  "🤨": "ceja duda sospecha the rock la roca meme",
  "🧐": "monoculo elegante detective investigar mirar",
  "🤐": "silencio callado boca secreto cerrar cierre",
  "😴": "dormir zzz sueno mimir cansado aburrido",
  "🤢": "asco vomito nausea verde feo",
  "🤮": "vomito potar asco vomitar",
  "😱": "grito susto miedo scream terror panico",
  "🤯": "mente explosion wow cerebro mindblown increible",
  "🤬": "groseria insulto enojo furia rabia puteada",
  "😡": "enojado furioso rabia rojo bravo",
  "😭": "llorar llanto triste crying lagrimas sad",
  "🥺": "ojitos por favor tierno please perdon",
  "👍": "like bien pulgar ok yes bueno positivo arriba",
  "👎": "dislike mal no pulgar abajo negativo malo",
  "👏": "aplauso palmas bravo clap aplaudir",
  "🙌": "manos arriba celebracion aleluya gracias",
  "🤝": "trato acuerdo handshake amigos negocio saludo",
  "👊": "golpe puno brofist choque fuerza pelea",
  "✌️": "paz victoria peace dos dedos",
  "🤟": "te quiero rock amor te amo",
  "🤘": "metal rock cuernos heavy rockanroll",
  "👌": "ok perfecto bien fino de diez",
  "🤌": "che italia italiano que decis que onda",
  "🤏": "poquito chiquito tiny poco pizca",
  "👋": "hola chau adios saludo wave despedida",
  "🤙": "shaka llamada chill surfer buena onda",
  "💪": "fuerza musculo fuerte gym fit entreno",
  "🖕": "dedo medio fuck off insulto groseria",
  "🧠": "cerebro mente brain inteligencia pensar",
  "👀": "ojos mirar ver eyes chisme espiar",
  "👅": "lengua tongue sabor lamer",
  "👄": "boca labios beso speak hablar",
  "❤️": "corazon amor love rojo love enamorado",
  "💔": "corazon roto desamor sad triste ruptura",
  "🔥": "fuego fire llama hot pro quemar crack",
  "✨": "brillo estrellas magic magia brillante sparkle",
  "⭐": "estrella star favorito top fav estrella",
  "🎉": "fiesta celebracion confeti party festejo",
  "💯": "cien 100 perfecto top real confirmado",
  "🙏": "rezar orar por favor gracias amen plegaria",
  "📢": "bocina megafono anuncio grito speaker audio sonido broadcast",
  "📣": "megafono altavoz anuncio noticia gritar avisar",
  "🔔": "campana timbre alert notificacion ding campanada",
  "🔕": "silencio sin campana mute callado",
  "🔊": "volumen audio sonido alto speaker fuerte maximo",
  "🔉": "volumen medio audio sonido normal",
  "🔇": "mute mudo sin sonido silencio muted",
  "🎙️": "microfono podcast estudio cantar voz grabacion",
  "📻": "radio fm am sintonizar musica retro",
  "🎧": "auriculares audifonos headphones musica escuchar",
  "🎵": "nota musica cancion melody sonido ritmo",
  "🎶": "notas musica ritmo musical melodias",
  "🎹": "piano teclado organo musica clasica tocar",
  "🥁": "tambor bateria drum badumtss percursion golpe",
  "🎷": "saxofon jazz musica viento saxo",
  "🎺": "trompeta horn corneta fanfare airhorn trompetazo",
  "🎸": "guitarra rock electrica metal musica tocar",
  "🎻": "violin cuerdas triste sad clasica drama",
  "🪗": "acordeon cumbia tango vallenato musica",
  "📯": "corneta postal correo aviso toque",
  "🎤": "microfono karaoke cantar show voz",
  "💿": "cd disco cancion musica vinilo",
  "📀": "dvd disco pelicula album",
  "⚡": "rayo trueno electricidad trueno impacto shock",
  "💥": "explosion boom choque impacto golpe kaboom",
  "💣": "bomba bomb kaboom terror explotar estallar",
  "⏰": "reloj alarma despertador tiempo hora sonar",
  "⏱️": "cronometro tiempo carrera stop segundo",
  "🎮": "videojuego control mando gamer gaming playstation xbox",
  "🕹️": "joystick arcade retro juego palanca",
  "👾": "alien invasor space invader retro gamer pixel",
  "🎯": "diana tiro blanco punteria acierto target sniper",
  "🎲": "dado azar juego suerte ludo rol",
  "🎰": "tragamonedas casino jackpot suerte plata ganar",
  "🏆": "trofeo copa ganador premio champion campeon win",
  "🥇": "primero medalla oro 1 ganador campeon",
  "👑": "corona rey reina king queen realeza victoria",
  "⚔️": "espadas batalla duelo combate lucha pvp fight",
  "🗡️": "espada daga cuchillo arma apunalar filo",
  "🛡️": "escudo defensa proteccion tanque resistir",
  "🏹": "arco flecha arquero punteria disparar",
  "🪄": "varita magica magia truco wizard hechicero",
  "🥷": "ninja sigilo asesino sombra espada naruto",
  "🚨": "policia sirena alarma alerta emergencia luz sonido",
  "⚠️": "advertencia peligro cuidado warning peligroso",
  "⛔": "prohibido stop no pasar prohibicion",
  "🚫": "prohibido no cancel bloquear denegado",
  "🛑": "alto stop senal pare detenerse freno",
  "☢️": "radiactivo nuclear peligro toxico radiacion",
  "☣️": "biopeligro biohazard virus infeccion peligro",
  "🆘": "sos ayuda auxilio rescate emergencia socorro",
  "❌": "error cruz equis no tachado cancel fallar",
  "⭕": "circulo correcto si acierto bien",
  "❗": "exclamacion alerta signo atencion ojo aviso",
  "❓": "pregunta interrogacion que duda curiosidad",
  "🧨": "dinamita petardo pirotecnia cuete fuego polvora",
  "🌪️": "tornado huracan viento tormenta caos",
  "🌊": "ola agua tsunami mar ocean corriente",
  "❄️": "nieve frio congelado hielo frozen helado",
  "🧪": "quimica pocion laboratorio ciencia experimento",
  "💉": "inyeccion vacuna jeringa sangre medico",
  "💊": "pastilla medicina droga cura farmacia",
  "🪦": "lapida tumba rip cementerio muerte funeral",
  "🦆": "pato duck cuak quack patito ave graznido",
  "🐱": "gato cat miau michi felino minino",
  "🐶": "perro dog guau perrito canino firulais ladrar",
  "🐺": "lobo wolf aullido luna salvaje aullar",
  "🦊": "zorro fox astuto furro animal",
  "🐻": "oso bear peluche gordo pardo",
  "🐼": "panda oso bambu tierno china",
  "🦁": "leon lion rey selva rugido rugir simba",
  "🐮": "vaca cow muuu leche ternero pasto",
  "🐷": "cerdo pig oink puerco marrano cochino",
  "🐸": "rana frog sapo pepe kermit croac anfibio",
  "🐵": "mono monkey simio chimpance monke banana",
  "🐔": "gallina chicken pollo kfc cloac kikiriki",
  "🐧": "pinguino penguin hielo frio linux ave",
  "🦅": "aguila eagle usa america rapaz volar",
  "🦉": "buho lechuza sabio noche ojos plumas",
  "🦇": "murcielago bat batman noche vampiro cueva",
  "🐝": "abeja bee miel avispa bzz picadura",
  "🦖": "tiranosaurio dinosaurio dino t-rex jurassic rugir",
  "🦕": "diplodocus dinosaurio brontosaurio cuello dino",
  "🐙": "pulpo octopus tentaculo mar calamar kraken",
  "🦈": "tiburon shark tiburonsin jaws peligro mar",
  "🐉": "dragon fuego mitico fantasia reptil",
  "🦄": "unicornio unicorn magia caballo cuerno arcoiris",
  "🍕": "pizza queso comida italia delivery rebanada",
  "🍔": "hamburguesa burger comida rapida mac carne",
  "🍟": "papas fritas fries comida papitas fastfood",
  "🌭": "hotdog perro caliente salchicha pan",
  "🍿": "palomitas pop corn cine pelicula pochoclos",
  "🍺": "cerveza beer trago alcohol chupi birra chopp",
  "🍻": "cervezas brindis salud copas bar fiesta birras",
  "🥂": "champagne brindis copas celebracion chin chin",
  "🍷": "vino wine copa tinto uva",
  "🥃": "whisky vaso trago licor hielo bourbon",
  "🍾": "botella champagne destapar corcho celebrar",
  "☕": "cafe coffee taza desayuno mimir caliente espresso",
  "🎈": "globo balloon fiesta cumpleanos flotar",
  "🎁": "regalo gift presente sorpresa caja envolver",
  "🎃": "calabaza halloween miedo terror susto spooky",
  "💵": "dolar billete dinero plata cash verde usd",
  "💰": "bolsa dinero saco plata oro rico botin",
  "🚽": "inodoro vater bano retrete toilet caca wc",
  "🪠": "desatascador sopa sopapa destapacanos bano",
};

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [custom, setCustom] = useState("");
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const DROPDOWN_WIDTH = 320;
    const DROPDOWN_MAX_HEIGHT = 380;
    const MARGIN = 10;

    const spaceBelow = vh - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;

    const placeAbove = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + DROPDOWN_WIDTH > vw - MARGIN) {
      left = Math.max(MARGIN, vw - DROPDOWN_WIDTH - MARGIN);
    }
    if (left < MARGIN) {
      left = MARGIN;
    }

    if (placeAbove) {
      const maxHeight = Math.max(200, Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove - MARGIN));
      setPositionStyle({
        position: "fixed",
        bottom: `${vh - rect.top + MARGIN}px`,
        left: `${left}px`,
        maxHeight: `${maxHeight}px`,
      });
    } else {
      const maxHeight = Math.max(200, Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow - MARGIN));
      setPositionStyle({
        position: "fixed",
        top: `${rect.bottom + MARGIN}px`,
        left: `${left}px`,
        maxHeight: `${maxHeight}px`,
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updateCoords]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (!isOpen) {
      updateCoords();
      setSearch("");
      setActiveCategory("all");
      setIsOpen(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setIsOpen(false);
    }
  };

  const applyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = custom.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setCustom("");
    setIsOpen(false);
  };

  // Filtrado de emojis por búsqueda o categoría
  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase().trim();

    return EMOJI_GROUPS.map((group) => {
      // Si hay categoría activa y no es 'all', filtrar por categoría
      if (!q && activeCategory !== "all" && group.id !== activeCategory) {
        return { ...group, emojis: [] };
      }

      // Si no hay búsqueda, devolver todos los emojis del grupo
      if (!q) {
        return group;
      }

      // Filtrar emojis por texto de búsqueda
      const matching = group.emojis.filter((emoji) => {
        if (emoji.includes(q)) return true;
        if (group.label.toLowerCase().includes(q)) return true;
        const kw = EMOJI_KEYWORDS[emoji];
        if (kw && kw.toLowerCase().includes(q)) return true;
        return false;
      });

      return {
        ...group,
        emojis: matching,
      };
    }).filter((g) => g.emojis.length > 0);
  }, [search, activeCategory]);

  const totalResults = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.emojis.length, 0);
  }, [filteredGroups]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        title="Elegir emoji"
        className={`glass-input w-full h-10 px-3.5 flex items-center justify-between gap-2 cursor-pointer hover:border-purple-500/40 transition-colors ${
          isOpen ? "border-purple-500 ring-2 ring-purple-500/20" : ""
        }`}
      >
        <span className="text-xl leading-none">{value || "🎵"}</span>
        <SmilePlus size={15} className={`shrink-0 transition-colors ${isOpen ? "text-purple-500" : "text-slate-400"}`} />
      </button>

      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <>
          <div
            className="fixed inset-0 z-[10000]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            style={positionStyle}
            className="glass-dropdown w-80 max-w-[calc(100vw-20px)] flex flex-col p-2.5 z-[10001] bg-white/85 dark:bg-[#0e111c]/85 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl glass-modal-enter gap-2"
          >
            {/* Buscador de emojis */}
            <div className="relative shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar (ej. risa, pato, trompeta...)"
                className="glass-input w-full pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-purple-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Pestañas de categorías rápidas (cuando no hay búsqueda activa) */}
            {!search && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px] shrink-0 border-b border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium ${
                    activeCategory === "all"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  ✨ Todos
                </button>
                {EMOJI_GROUPS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium ${
                      activeCategory === cat.id
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {cat.icon} {cat.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Cuadrícula de emojis con scroll */}
            <div className="overflow-y-auto custom-scrollbar flex-1 max-h-56 pr-0.5 space-y-2.5">
              {filteredGroups.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <p>No se encontraron emojis para &ldquo;{search}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(search.trim());
                      setIsOpen(false);
                    }}
                    className="mt-2 px-3 py-1 rounded-lg bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-600/25 transition-colors"
                  >
                    Usar &ldquo;{search.trim()}&rdquo; como emoji
                  </button>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.id}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                      <span>{group.label}</span>
                      <span className="font-mono text-[9px] opacity-60 tabular-nums">
                        {group.emojis.length}
                      </span>
                    </p>
                    <div className="grid grid-cols-8 gap-1">
                      {[...new Set(group.emojis)].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            onChange(emoji);
                            setIsOpen(false);
                          }}
                          title={emoji}
                          className={`h-8 w-8 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer hover:bg-purple-500/20 hover:scale-125 active:scale-95 ${
                            value === emoji
                              ? "bg-purple-500/25 ring-1.5 ring-purple-500 text-white"
                              : "hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pie: Pegar emoji personalizado o quitar */}
            <div className="pt-2 border-t border-black/5 dark:border-white/10 space-y-1.5 shrink-0">
              <form
                onSubmit={applyCustom}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="O pega tu propio emoji…"
                  maxLength={32}
                  className="glass-input flex-1 min-w-0 px-2 py-1 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!custom.trim()}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  Usar
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Ban size={12} />
                <span>Sin emoji</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
