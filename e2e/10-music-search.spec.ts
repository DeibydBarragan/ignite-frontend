import { test, expect } from "./fixtures/auth.fixture";

const yt = (id: string, title: string) => ({
  id,
  title,
  artist: "Bad Bunny",
  albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
  url: `https://www.youtube.com/watch?v=${id}`,
  duration: 200,
  formattedDuration: "3:20",
  source: "youtube" as const,
  category: "hits" as const,
});

const YT_RESULTS = [yt("yt1", "Ojitos Lindos"), yt("yt2", "Moscow Mule"), yt("yt3", "Dakiti")];

const FAVORITE_ROWS = [
  {
    song_id: "fav1",
    title: "Titi Me Pregunto",
    artist: "Bad Bunny",
    album_art: null,
    url: "https://www.youtube.com/watch?v=fav1",
    duration: 240,
    source: "youtube",
    is_lyric: false,
  },
];

test.describe("Fase 7 — Buscador de música con tarjetas", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.route("**/rest/v1/user_favorites**", (route) =>
      route.fulfill({ status: 200, json: FAVORITE_ROWS })
    );
    await authedPage.route("**/api/music/search**", (route) =>
      route.fulfill({ status: 200, json: { results: YT_RESULTS } })
    );
  });

  test("muestra primero las favoritas y después YouTube, y el filtro cambia la lista", async ({ authedPage }) => {
    await authedPage.goto("/#music");
    await authedPage.getByPlaceholder(/Buscar canción, artista/i).fill("bad bunny");

    const cards = authedPage.getByRole("article");
    await expect(cards).toHaveCount(4);
    await expect(cards.first()).toHaveAttribute("aria-label", /Titi Me Pregunto/);
    await expect(cards.nth(1)).toHaveAttribute("aria-label", /Ojitos Lindos/);
    await expect(authedPage.getByText(/1 favorita · 3 de YouTube/)).toBeVisible();

    await authedPage.getByRole("radio", { name: "Favoritos" }).click();
    await expect(cards).toHaveCount(1);

    await authedPage.getByRole("radio", { name: "YouTube" }).click();
    await expect(cards).toHaveCount(3);

    await authedPage.getByRole("radio", { name: "Todo" }).click();
    await expect(cards).toHaveCount(4);
  });

  test("con el filtro 'Favoritos' no se pide nada a YouTube", async ({ authedPage }) => {
    let searchCalls = 0;
    await authedPage.route("**/api/music/search**", (route) => {
      searchCalls += 1;
      return route.fulfill({ status: 200, json: { results: YT_RESULTS } });
    });

    await authedPage.goto("/#music");
    await authedPage.getByRole("radio", { name: "Favoritos" }).click();
    await authedPage.getByPlaceholder(/Buscar canción, artista/i).fill("bad bunny");

    await expect(authedPage.getByRole("article")).toHaveCount(1);
    await authedPage.waitForTimeout(700);
    expect(searchCalls).toBe(0);
  });

  test("usar una tarjeta no cierra los resultados, bloquea solo esa canción y las encola en orden", async ({ authedPage }) => {
    const playQueries: string[] = [];
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    await authedPage.route("**/api/music/guilds/*/play", async (route) => {
      const body = route.request().postDataJSON() as { query?: string };
      playQueries.push(body.query ?? "");
      if (playQueries.length === 1) await gate; // la primera queda en espera
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await authedPage.goto("/#music");
    const input = authedPage.getByPlaceholder(/Buscar canción, artista/i);
    await input.fill("bad bunny");
    await authedPage.getByRole("radio", { name: "YouTube" }).click();
    await expect(authedPage.getByRole("article")).toHaveCount(3);

    const queue = (title: string) => authedPage.getByRole("button", { name: `Añadir ${title} a la cola` });
    const next = (title: string) => authedPage.getByRole("button", { name: `Reproducir ${title} a continuación` });
    const play = (title: string) => authedPage.getByRole("button", { name: `Reproducir ${title}`, exact: true });

    // 1) Se pulsa "Cola" en la primera canción.
    await queue("Ojitos Lindos").click();
    await expect(queue("Ojitos Lindos")).toBeDisabled();
    await expect(next("Ojitos Lindos")).toBeDisabled();
    await expect(play("Ojitos Lindos")).toBeDisabled();

    // 2) Las demás tarjetas siguen libres.
    await expect(queue("Moscow Mule")).toBeEnabled();
    await expect(queue("Dakiti")).toBeEnabled();

    // 3) Se pulsa "Cola" en una segunda canción mientras la primera sigue en curso.
    await queue("Moscow Mule").click();
    await expect(queue("Moscow Mule")).toBeDisabled();

    // Los resultados y el texto siguen ahí.
    await expect(authedPage.getByRole("article")).toHaveCount(3);
    await expect(input).toHaveValue("bad bunny");

    // La cola es una sola: la segunda petición no sale hasta que termina la primera.
    await authedPage.waitForTimeout(600);
    expect(playQueries).toHaveLength(1);
    expect(playQueries[0]).toContain("yt1");

    release();
    await expect.poll(() => playQueries.length).toBe(2);
    expect(playQueries[1]).toContain("yt2");

    await expect(queue("Ojitos Lindos")).toBeEnabled();
    await expect(queue("Moscow Mule")).toBeEnabled();
    await expect(authedPage.getByRole("article")).toHaveCount(3);
    await expect(input).toHaveValue("bad bunny");
  });

  test("elegir una pestaña del catálogo sale de la búsqueda", async ({ authedPage }) => {
    await authedPage.goto("/#music");
    const input = authedPage.getByPlaceholder(/Buscar canción, artista/i);
    await input.fill("bad bunny");
    await expect(authedPage.getByText(/Resultados para/)).toBeVisible();

    await authedPage.getByRole("button", { name: /^Top Canciones/i }).click();
    await expect(input).toHaveValue("");
    await expect(authedPage.getByText(/Resultados para/)).toBeHidden();
  });

  test("con un enlace pegado el filtro se oculta y se conserva el flujo anterior", async ({ authedPage }) => {
    await authedPage.goto("/#music");
    await authedPage.getByPlaceholder(/Buscar canción, artista/i).fill("https://www.youtube.com/watch?v=abc123");

    await expect(authedPage.getByRole("radiogroup", { name: "Dónde buscar" })).toBeHidden();
    await expect(authedPage.getByRole("button", { name: /Encolar/ })).toBeVisible();
    await expect(authedPage.getByText(/Resultados para/)).toBeHidden();
  });
});
