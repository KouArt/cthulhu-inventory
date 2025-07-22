// Módulo para Foundry VTT - Sistema Call of Cthulhu
// Este módulo adiciona uma aba com visualização do corpo e sistema de armadura + inventário com slots arrastáveis, visuais, controle de ocupação e sincronização

Hooks.once('init', () => {
  console.log("[Call of Cthulhu Body Armor Module] Iniciando módulo...");

  Hooks.on("renderActorSheet", async (app, html, data) => {
    if (app.actor.type !== "character") return;

    const tabNav = html.find(".sheet-tabs");
    const tabContent = html.find(".sheet-body");
    if (!html.find("[data-tab='body-armor']").length) {
      tabNav.append(`<a class="item" data-tab="body-armor">Corpo & Inventário</a>`);

      const items = app.actor.items;
      const slotMap = new Map();
      for (let item of items) {
        const slot = item.getFlag("cthulhu-inventory", "slot");
        if (typeof slot === "number") {
          slotMap.set(slot, item);
        }
      }

      const inventorySlots = Array.from({ length: 20 }, (_, i) => {
        const item = slotMap.get(i);
        if (item) {
          return `<div class="inventory-slot filled" data-index="${i}" data-item-id="${item.id}" draggable="true" ondragstart="window.dragItem(event, '${item.id}')" ondragover="event.preventDefault()" ondrop="window.dropItem(event, ${i})" oncontextmenu="window.removeItem(event, ${i})" title="${item.name}">${item.name}</div>`;
        } else {
          return `<div class="inventory-slot" data-index="${i}" ondragover="event.preventDefault()" ondrop="window.dropItem(event, ${i})"></div>`;
        }
      }).join("");

      tabContent.append(`
        <div class="tab" data-tab="body-armor">
          <h2>Visual do Corpo</h2>
          <div class="body-armor-grid">
            <div><strong>Capacete:</strong> ${data.actor.system.armor?.helmet || "Nenhum"}</div>
            <div><strong>Peitoral:</strong> ${data.actor.system.armor?.chest || "Nenhum"}</div>
            <div><strong>Braços:</strong> ${data.actor.system.armor?.arms || "Nenhum"}</div>
            <div><strong>Luvas:</strong> ${data.actor.system.armor?.gloves || "Nenhum"}</div>
            <div><strong>Pernas:</strong> ${data.actor.system.armor?.legs || "Nenhum"}</div>
            <div><strong>Botas:</strong> ${data.actor.system.armor?.boots || "Nenhum"}</div>
          </div>

          <h2>Inventário em Grade</h2>
          <div class="inventory-grid">
            ${inventorySlots}
          </div>
        </div>
      `);
    }
  });
});

Hooks.once('ready', () => {
  console.log("[Call of Cthulhu Body Armor Module] Pronto e operando!");
});

// Função para arrastar item
window.dragItem = (event, itemId) => {
  const actorId = game.user.character?.id;
  event.dataTransfer.setData("text/plain", JSON.stringify({ actorId, itemId }));
};

// Função para dropar item no slot
window.dropItem = async (event, slotIndex) => {
  event.preventDefault();
  const data = JSON.parse(event.dataTransfer.getData("text/plain"));
  const actor = game.actors.get(data.actorId);
  const item = actor?.items.get(data.itemId);

  if (!actor || !item) return;

  const existing = actor.items.find(i => i.getFlag("cthulhu-inventory", "slot") === slotIndex);
  if (existing?.id === item.id) return;

  if (existing) {
    await existing.update({ "flags.cthulhu-inventory.slot": null });
  }

  await item.update({ "flags.cthulhu-inventory.slot": slotIndex });

  const sheet = actor.sheet;
  if (sheet.rendered) sheet.render(true);
  ui.notifications.info(`Item '${item.name}' colocado no slot ${slotIndex + 1}`);
};

// Função para remover item de um slot
window.removeItem = async (event, slotIndex) => {
  event.preventDefault();
  const actor = game.user.character;
  if (!actor) return;
  const item = actor.items.find(i => i.getFlag("cthulhu-inventory", "slot") === slotIndex);
  if (!item) return;

  await item.update({ "flags.cthulhu-inventory.slot": null });
  if (actor.sheet.rendered) actor.sheet.render(true);
  ui.notifications.info(`Item '${item.name}' removido do slot ${slotIndex + 1}`);
};

// Estilo customizado
Hooks.once('renderApplication', () => {
  const style = document.createElement("style");
  style.textContent = `
    .body-armor-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 6px;
    }

    .inventory-grid {
      display: grid;
      grid-template-columns: repeat(5, 60px);
      grid-template-rows: repeat(4, 60px);
      gap: 4px;
      padding: 6px;
      border: 1px solid #999;
      background: #222;
    }

    .inventory-slot {
      border: 1px dashed #666;
      background: #333;
      width: 60px;
      height: 60px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 10px;
      text-align: center;
      cursor: pointer;
      color: #fff;
    }

    .inventory-slot.filled {
      background: #555;
      border: 2px solid #999;
    }
  `;
  document.head.appendChild(style);
});
