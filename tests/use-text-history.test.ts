import { describe, expect, it } from "vitest";
import { TextHistoryManager } from "@/features/tts/hooks/use-text-history";

describe("TextHistoryManager", () => {
  it("inicia con el valor inicial y canUndo/canRedo en false", () => {
    const manager = new TextHistoryManager("");
    expect(manager.current).toBe("");
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
  });

  it("permite deshacer tras commits sucesivos", () => {
    const manager = new TextHistoryManager("");

    // Usuario escribe y emite
    manager.commit("Hola mundo");
    expect(manager.current).toBe("Hola mundo");
    expect(manager.canUndo).toBe(true);

    manager.commit("");
    expect(manager.current).toBe("");
    expect(manager.canUndo).toBe(true);

    // Al hacer undo, vuelve a "Hola mundo"
    const undid = manager.undo();
    expect(undid).toBe("Hola mundo");
    expect(manager.current).toBe("Hola mundo");
    expect(manager.canRedo).toBe(true);

    // Al hacer redo, vuelve a ""
    const redid = manager.redo();
    expect(redid).toBe("");
    expect(manager.current).toBe("");
  });

  it("registra cambios no comiteados al momento de hacer undo", () => {
    const manager = new TextHistoryManager("");
    manager.commit("Texto base");

    // El usuario escribió algo en el textarea que no se había comiteado aún
    const uncommitted = "Texto en progreso";
    const undid = manager.undo(uncommitted);

    // Al deshacer, vuelve a "Texto base"
    expect(undid).toBe("Texto base");
    expect(manager.current).toBe("Texto base");

    // Al rehacer, vuelve a "Texto en progreso"
    const redid = manager.redo();
    expect(redid).toBe("Texto en progreso");
    expect(manager.current).toBe("Texto en progreso");
  });

  it("trunca el futuro si el usuario comitea un nuevo texto tras deshacer", () => {
    const manager = new TextHistoryManager("");
    manager.commit("Mensaje A");
    manager.commit("Mensaje B");

    // Deshacer a "Mensaje A"
    manager.undo();
    expect(manager.current).toBe("Mensaje A");
    expect(manager.canRedo).toBe(true);

    // Escribir y comitear "Mensaje C"
    manager.commit("Mensaje C");
    expect(manager.current).toBe("Mensaje C");
    expect(manager.canRedo).toBe(false);

    // Deshacer ahora regresa a "Mensaje A", no a "Mensaje B"
    manager.undo();
    expect(manager.current).toBe("Mensaje A");
  });

  it("respeta el límite maxHistory", () => {
    const manager = new TextHistoryManager("0", 3);
    manager.commit("1");
    manager.commit("2");
    manager.commit("3");
    manager.commit("4");

    expect(manager.current).toBe("4");
    expect(manager.allHistory.length).toBeLessThanOrEqual(4);
  });

  it("evita duplicar entradas consecutivas idénticas", () => {
    const manager = new TextHistoryManager("");
    const res1 = manager.commit("Mismo texto");
    const res2 = manager.commit("Mismo texto");

    expect(res1).toBe(true);
    expect(res2).toBe(false);
    expect(manager.allHistory.length).toBe(2); // ["", "Mismo texto"]
  });

  it("permite resetear el historial", () => {
    const manager = new TextHistoryManager("");
    manager.commit("Mensaje");
    manager.reset("Nuevo inicio");

    expect(manager.current).toBe("Nuevo inicio");
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
  });
});
