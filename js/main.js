/* Chai & Co site script
   1. Hero video autoplay + pause toggle
   2. Build Your Chai (landing page only)
   3. Chai & Co Concierge chatbot (both pages) */

(function () {
  "use strict";

  /* ---------- 1. Hero video ---------- */
  var video = document.getElementById("heroVideo");
  var toggle = document.getElementById("videoToggle");
  if (video) {
    video.muted = true;
    var tryPlay = function () {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    };
    tryPlay();
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && !video.dataset.userPaused) tryPlay();
    });
    if (toggle) {
      toggle.addEventListener("click", function () {
        if (video.paused) {
          delete video.dataset.userPaused;
          tryPlay();
          toggle.textContent = "Pause";
          toggle.setAttribute("aria-label", "Pause background video");
        } else {
          video.dataset.userPaused = "1";
          video.pause();
          toggle.textContent = "Play";
          toggle.setAttribute("aria-label", "Play background video");
        }
      });
    }
  }

  /* ---------- 2. Build Your Chai ---------- */
  var BASES = {
    karak:    { label: "Karak",         color: "#7a3f1f", price: 5.00, place: "Deep Ellum",
                note: "Strong black tea, cardamom and a long simmer. The house classic." },
    masala:   { label: "Masala",        color: "#8a4e28", price: 5.25, place: "Bishop Arts",
                note: "Ginger, clove, cinnamon and black pepper. Warm and a little peppery." },
    kashmiri: { label: "Kashmiri pink", color: "#d48e98", price: 6.25, place: "Lower Greenville",
                note: "Green tea, a pinch of salt, aerated until it turns rose pink. Soft and nutty." },
    saffron:  { label: "Saffron",       color: "#d08a1e", price: 6.50, place: "Uptown",
                note: "Saffron threads, cardamom and honey. Golden and fragrant." }
  };
  var MILKS = {
    whole:  { label: "whole milk",   mix: 0.42, extra: 0 },
    oat:    { label: "oat milk",     mix: 0.36, extra: 0.75 },
    almond: { label: "almond milk",  mix: 0.30, extra: 0.75 }
  };
  var SPICE_WORDS = ["", "Whisper", "Sunset", "Night Owl", "Firecracker", "Heatwave"];
  var SPICE_DESC = ["", "gentle spice", "light spice", "medium spice", "bold spice", "fiery spice"];
  var SWEET_DESC = { none: "no sugar", light: "light sweetness", classic: "classic sweetness", extra: "extra sweet" };

  var state = { base: "karak", milk: "whole", spice: 3, sweet: "classic", iced: false, shot: false, foam: false };

  function mix(hexA, hexB, t) {
    var a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
    var g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
    var bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  function drinkName(s) {
    var base = BASES[s.base];
    var noun = s.iced ? "Cold Front" : SPICE_WORDS[s.spice];
    return "The " + (s.shot ? "Dirty " : "") + base.place + " " + noun;
  }

  function drinkPrice(s) {
    var p = BASES[s.base].price + MILKS[s.milk].extra;
    if (s.shot) p += 1.00;
    if (s.foam) p += 0.75;
    return p;
  }

  function drinkDesc(s) {
    var parts = [BASES[s.base].label + " with " + MILKS[s.milk].label, SPICE_DESC[s.spice], SWEET_DESC[s.sweet]];
    if (s.iced) parts.push("served iced");
    var extras = [];
    if (s.shot) extras.push("an espresso shot");
    if (s.foam) extras.push("rose cold foam");
    var text = parts.join(", ");
    if (extras.length) text += ", plus " + extras.join(" and ");
    return text + ".";
  }

  function money(n) { return "$" + n.toFixed(2); }

  var buildRoot = document.getElementById("build");
  if (buildRoot) {
    var liquid = document.getElementById("liquid");
    var foam = document.getElementById("foam");
    var ice = document.getElementById("ice");
    var shotLayer = document.getElementById("shot-layer");
    var steam = document.getElementById("steam");
    var wisps = ["w2", "w1", "w3", "w4", "w5"].map(function (c) { return steam.querySelector("." + c); });
    var nameEl = document.getElementById("drinkName");
    var descEl = document.getElementById("drinkDesc");
    var priceEl = document.getElementById("drinkPrice");
    var noteEl = document.getElementById("baseNote");
    var spiceInput = document.getElementById("spice");
    var spiceValue = document.getElementById("spiceValue");
    var savedMsg = document.getElementById("savedMsg");

    var render = function () {
      var base = BASES[state.base];
      var milk = MILKS[state.milk];
      var milkTone = state.base === "kashmiri" ? "#f6e3e6" : "#f2e3cf";
      var color = mix(base.color, milkTone, milk.mix + (state.iced ? 0.08 : 0));
      liquid.style.setProperty("--chai", color);
      liquid.setAttribute("fill", color);

      foam.classList.toggle("on", state.foam || state.milk === "whole");
      foam.classList.toggle("rose", state.foam);
      ice.classList.toggle("on", state.iced);
      shotLayer.classList.toggle("on", state.shot);
      steam.classList.toggle("off", state.iced);
      wisps.forEach(function (w, i) { w.classList.toggle("on", i < state.spice); });

      noteEl.textContent = base.note;
      spiceValue.textContent = state.spice + " of 5";
      nameEl.textContent = drinkName(state);
      descEl.textContent = drinkDesc(state);
      priceEl.textContent = money(drinkPrice(state));
      window.chaiCurrent = { name: drinkName(state), desc: drinkDesc(state), price: money(drinkPrice(state)), state: state };
    };

    var wireChips = function (groupId, key, attr) {
      var group = document.getElementById(groupId);
      group.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        group.querySelectorAll(".chip").forEach(function (c) {
          c.classList.remove("is-on");
          c.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-on");
        btn.setAttribute("aria-pressed", "true");
        state[key] = btn.getAttribute(attr);
        savedMsg.textContent = "";
        render();
      });
      group.querySelectorAll(".chip").forEach(function (c) {
        c.setAttribute("aria-pressed", c.classList.contains("is-on") ? "true" : "false");
      });
    };
    wireChips("baseChips", "base", "data-base");
    wireChips("milkChips", "milk", "data-milk");
    wireChips("sweetChips", "sweet", "data-sweet");

    spiceInput.addEventListener("input", function () {
      state.spice = parseInt(spiceInput.value, 10);
      savedMsg.textContent = "";
      render();
    });
    ["iced", "shot", "foam"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", function (e) {
        state[id] = e.target.checked;
        savedMsg.textContent = "";
        render();
      });
    });

    document.getElementById("saveOrder").addEventListener("click", function () {
      var order = window.chaiCurrent;
      try { localStorage.setItem("chaiOrder", JSON.stringify(order)); } catch (err) {}
      savedMsg.textContent = "Saved. Tell the counter you want " + order.name + " and we will make it exactly like this.";
    });

    document.getElementById("askAbout").addEventListener("click", function () {
      if (window.chaiConcierge) window.chaiConcierge.askAboutDrink();
    });

    try {
      var prev = JSON.parse(localStorage.getItem("chaiOrder") || "null");
      if (prev && prev.name) savedMsg.textContent = "Your last saved order was " + prev.name + ".";
    } catch (err) {}

    render();
  }

  /* ---------- 3. Concierge chatbot ---------- */
  if (document.body.getAttribute("data-chatbot") === "external") return;

  var KB = [
    /* ---- Chai knowledge (placed first so specific questions win ties) ---- */
    { keys: ["what is chai", "what does chai mean", "chai mean", "meaning of chai", "define chai", "word chai"],
      reply: "Chai simply means tea in Urdu, and the word traces back to the Chinese word cha. What most people in the US call chai is masala chai, which is black tea simmered with milk, sugar and warm spices like cardamom and ginger, the way it is made in homes all across Pakistan." },
    { keys: ["chai tea"],
      reply: "Fun fact, since chai already means tea, saying chai tea is a little like saying tea tea. It is a common phrase in the US though, so we always know what you mean." },
    { keys: ["history", "origin", "come from", "where did chai", "invented", "started drinking"],
      reply: "Spiced drinks made with ginger and cardamom go back a long way in the region, but black tea with milk spread across the subcontinent, including what is now Pakistan, in the early 1900s as British tea companies promoted it. Families and street vendors made it their own with milk, sugar and spice, and today Pakistan is one of the largest tea importers in the world." },
    { keys: ["what spices", "spices", "ingredients", "in your chai", "whats in", "what is in"],
      reply: "Masala chai usually starts with green cardamom and fresh ginger, and many families add cinnamon, cloves, black pepper or fennel depending on their own recipe. Our house blend uses cardamom, ginger and a little clove, and the Masala adds cinnamon and black pepper." },
    { keys: ["cardamom"],
      reply: "Cardamom is the heart of most chai. It is the seed pod of a plant in the ginger family, and we crack green cardamom pods right before brewing so the oils stay fresh. Ours comes from Guatemala, which is one of the largest cardamom growers in the world." },
    { keys: ["what is karak", "karak mean", "karak"],
      reply: "Karak means strong in Urdu. Karak chai is a strong, milky tea that is simmered longer than usual, and it is loved in Pakistan and across the Gulf in places like Dubai and Qatar. Ours is black tea simmered with cardamom until it is thick and a little smoky, $5.50." },
    { keys: ["kashmiri", "noon chai", "pink", "why is it pink"],
      reply: "Kashmiri chai, also called noon chai, comes from Kashmir and is a favorite across Pakistan, especially in winter. Noon means salt in Kashmiri, and the tea is made from green tea leaves boiled with a pinch of baking soda and salt, then aerated for a long time. When milk is added it turns rose pink. We top ours with crushed pistachio, $7.00." },
    { keys: ["saffron", "zafran"],
      reply: "Saffron comes from the stigmas of the crocus flower and is the most expensive spice in the world by weight, since each flower gives only a few threads. Our Saffron zafran uses Kashmiri saffron with cardamom and honey, $6.75." },
    { keys: ["what tea", "which tea", "tea do you use", "assam", "ctc", "darjeeling", "tea leaves", "loose leaf", "black tea"],
      reply: "We brew strong CTC black tea from Kenya, the same kind most Pakistani households use, since Pakistan imports most of its tea from Kenya. CTC stands for crush, tear, curl, a way of processing the leaves into small granules that brew dark and strong, which is why it holds up so well to milk and spice." },
    { keys: ["latte", "chai latte", "starbucks", "concentrate", "syrup", "difference between"],
      reply: "A chai latte at most coffee shops is steamed milk mixed with a sweet chai concentrate or syrup. Traditional chai is different because the tea leaves and spices are boiled together with the milk on the stove, which gives a stronger tea flavor and less sweetness. That stovetop way is how we make every cup." },
    { keys: ["kulhad", "clay cup", "clay"],
      reply: "A kulhad is a small unglazed clay cup used for chai in Pakistan and across the region. The clay gives the tea a slightly earthy smell, and traditionally the cups were used once and returned to the earth. We serve our chai in clay cups for that reason." },
    { keys: ["chaiwala", "chai wala", "vendor", "street chai"],
      reply: "A chaiwala is a tea seller, usually at a roadside dhaba or train station in Pakistan, brewing big pots of chai all day and pouring it into small cups. Much of what we do at the counter is inspired by that style." },
    { keys: ["pour from height", "pulled", "pulling", "froth", "why do you pour", "pour"],
      reply: "Pouring chai from height between two pots cools it slightly, mixes it evenly and builds a light froth on top. You will see the same idea in Malaysia, where a pulled milk tea called teh tarik is made this way." },
    { keys: ["doodh patti", "doodh pati", "milk tea", "no water"],
      reply: "Doodh patti means milk and leaves in Urdu. It is a Pakistani style of chai where the tea is brewed directly in milk with little or no water, which makes it extra rich and creamy. Ask for any of our chai made doodh patti style." },
    { keys: ["at home", "make it myself", "recipe", "make chai", "how to make"],
      reply: "A simple way to make chai at home is to boil about 1 cup of water with 2 crushed cardamom pods and a few slices of fresh ginger, add 2 teaspoons of loose black tea, then pour in 1 cup of milk and sugar to taste. Let it rise to a boil twice, lowering the heat between each rise, then strain it into your cup." },
    { keys: ["healthy", "health", "benefit", "good for you", "antioxidant"],
      reply: "Black tea naturally has caffeine and plant compounds called polyphenols, and spices like ginger and cardamom have been part of home remedies for a long time. We are a cafe and not doctors though, so for anything health related it is best to ask your own physician." },
    { keys: ["hour", "open", "close", "closing", "late", "time", "when", "tonight", "midnight", "1am"],
      reply: "We are open Monday to Thursday 7am to midnight, Friday and Saturday 7am to 1am, and Sunday 9am to midnight." },
    { keys: ["where", "address", "location", "located", "find you", "directions", "bishop", "davis"],
      reply: "We are on West Davis Street in the Bishop Arts District in Dallas. There is street parking out front and a lot behind the building after 6pm." },
    { keys: ["park", "parking", "car"],
      reply: "Street parking on West Davis works most of the day, and the lot behind our building opens up after 6pm." },
    { keys: ["menu", "drinks", "price", "cost", "how much", "serve", "offer"],
      reply: "Hot chai is Karak $5.50, Masala $5.50, Doodh patti $5.75, Dirty chai $6.25, Saffron zafran $6.75 and Kashmiri pink with pistachio $7.00. Cold drinks are Iced karak $6.00 and Rose iced chai $6.50. From the bakery we have cake rusk, naan khatai, zeera biscuits, pistachio tea cake, chicken patties, aloo samosas, bun kebabs and gulab jamun. The full menu with prices is on the home page." },
    { keys: ["recommend", "suggest", "should i", "best", "favorite", "popular", "first time", "what to get", "order"],
      reply: "First time here? Get the Karak. It is strong, milky and what we are known for. If you like things sweeter and softer, go with Saffron zafran. Want caffeine for a long night? Dirty chai." },
    { keys: ["sweet", "sugar", "honey"],
      reply: "Every chai can be made with no sugar, light, classic or extra sweet. Saffron zafran is sweetened with honey and is the sweetest on the menu." },
    { keys: ["strong", "bold", "spicy", "spice", "ginger"],
      reply: "For strength, Karak is the one. For spice, ask for Masala at level 5 in Build Your Chai. It brings a lot of ginger and black pepper." },
    { keys: ["how much caffeine", "caffeine", "coffee", "espresso", "dirty", "awake", "energy"],
      reply: "An 8 ounce cup of brewed black tea usually has roughly 40 to 70 mg of caffeine, compared with about 95 mg in a cup of drip coffee, so a regular chai has about half the caffeine. Add an espresso shot, which makes it a dirty chai, and it lands closer to a latte." },
    { keys: ["dairy", "vegan", "oat", "almond", "lactose", "milk"],
      reply: "Yes, every chai can be made with oat or almond milk for $0.75. Kashmiri pink tastes best with oat because it keeps the pink color." },
    { keys: ["food", "eat", "snack", "samosa", "pastry", "pastries", "bakery", "rusk", "naan khatai", "biscuit", "cookie", "cake", "patty", "patties", "kebab", "dessert", "sweet treat", "gulab jamun", "shortbread"],
      reply: "From the bakery we have cake rusk for dunking $3.00, naan khatai $2.50, zeera biscuits $2.50, pistachio tea cake $4.25, chicken patties $4.50, aloo samosas $3.50, bun kebabs $7.50 and gulab jamun $4.00. Cake rusk with a karak is the classic pairing." },
    { keys: ["study", "wifi", "wi-fi", "laptop", "outlet", "work", "student"],
      reply: "Study Sundays run from 6pm to close with quiet tables and outlets everywhere. Show a student ID and your second cup is half off. Wifi is free every day." },
    { keys: ["event", "open mic", "music", "poetry", "thursday", "night"],
      reply: "Thursday is open mic night with poetry, guitar and stand-up. Sign up at the counter by 8pm. Sundays are quiet study nights." },
    { keys: ["cater", "catering", "wedding", "party", "iftar", "office", "event booking"],
      reply: "We cater across DFW. We bring a brass pot, cups and a server for weddings, iftars, office events and study sessions. Send us a message a week ahead with your date and headcount." },
    { keys: ["reserve", "reservation", "book", "group", "table"],
      reply: "We do not take table reservations, but groups of eight or more can message us a day ahead and we will save a long table." },
    { keys: ["brew", "made", "how do you make", "how do you"],
      reply: "Every pot is made on the stove. We crack the spices, simmer black tea until it turns brick red, let the milk rise twice, then pull it from height before pouring. About twelve minutes a pot. The full process is on our story page." },
    { keys: ["your story", "founder", "who started", "who owns", "owner", "why did you open", "why open"],
      reply: "Chai & Co was founded by Muiz Shah, who grew up in a small town in Texas where chai was part of every morning in his household, and he still has a cup every day. His full note is on the Our Story page." },
    { keys: ["build", "custom", "create", "design my"],
      reply: "Scroll to Build Your Chai on the home page. Pick a base, milk, spice and sweetness and we will name your drink and price it. You can save it and order it at the counter." },
    { keys: ["hello", "hi", "hey", "salaam", "salam", "yo", "good morning", "good evening"],
      reply: "Hey! I am the Chai & Co concierge. Ask me about our menu and hours, or anything about chai itself." },
    { keys: ["thank", "thanks", "appreciate", "perfect", "great"],
      reply: "Anytime. Come say hi at the counter." }
  ];

  var QUICK = ["What is chai?", "What should I order?", "Why is Kashmiri chai pink?", "Hours", "Dairy free?"];

  function normalize(s) { return " " + s.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").replace(/\s+/g, " ") + " "; }

  function answer(text) {
    var q = normalize(text);
    var best = null, bestScore = 0;
    KB.forEach(function (item) {
      var score = 0;
      item.keys.forEach(function (k) {
        var key = k.toLowerCase();
        var hit = key.length <= 3 ? q.indexOf(" " + key + " ") !== -1 : q.indexOf(key) !== -1;
        if (hit) {
          score += key.indexOf(" ") !== -1 ? 2 : 1;
        }
      });
      if (score > bestScore) { bestScore = score; best = item; }
    });
    if (best) return best.reply;
    return "I am not sure about that one, and I would rather not guess. I can help with our menu, hours and events, or questions about chai itself like what karak means, why Kashmiri chai is pink or how to make chai at home.";
  }

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "chat-launcher";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "chatPanel");
  launcher.innerHTML = '<span class="dot" aria-hidden="true">C</span><span>Ask the concierge</span>';

  var panel = document.createElement("section");
  panel.className = "chat-panel";
  panel.id = "chatPanel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Chai and Co concierge chat");
  panel.innerHTML =
    '<div class="chat-head">' +
      '<span class="dot" aria-hidden="true">C</span>' +
      '<div class="chat-head-text"><strong>Chai &amp; Co Concierge</strong><span>Usually replies instantly</span></div>' +
      '<button type="button" class="chat-close" aria-label="Close chat">&times;</button>' +
    '</div>' +
    '<div class="chat-log" id="chatLog" role="log" aria-live="polite"></div>' +
    '<div class="chat-quick" id="chatQuick"></div>' +
    '<form class="chat-form" id="chatForm" autocomplete="off">' +
      '<label for="chatInput" class="visually-hidden" style="position:absolute;left:-9999px">Message</label>' +
      '<input id="chatInput" type="text" placeholder="Ask about hours, drinks, events..." maxlength="300">' +
      '<button type="submit">Send</button>' +
    '</form>';

  var teaser = document.createElement("button");
  teaser.type = "button";
  teaser.className = "chat-teaser";
  teaser.hidden = true;
  teaser.textContent = "Not sure what to order? Ask me.";

  document.body.appendChild(teaser);
  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  setTimeout(function () { if (panel.hidden) teaser.hidden = false; }, 2500);
  teaser.addEventListener("click", function () { open(); });

  var log = panel.querySelector("#chatLog");
  var quick = panel.querySelector("#chatQuick");
  var form = panel.querySelector("#chatForm");
  var input = panel.querySelector("#chatInput");
  var started = false;

  function addMsg(text, who) {
    var m = document.createElement("div");
    m.className = "msg " + who;
    m.textContent = text;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }

  function botReply(text) {
    var t = document.createElement("div");
    t.className = "msg bot typing";
    t.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(t);
    log.scrollTop = log.scrollHeight;
    setTimeout(function () {
      t.remove();
      addMsg(text, "bot");
    }, 550 + Math.min(text.length * 6, 700));
  }

  function renderQuick() {
    quick.innerHTML = "";
    QUICK.forEach(function (label) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", function () { send(label); });
      quick.appendChild(b);
    });
  }

  function send(text) {
    text = (text || "").trim();
    if (!text) return;
    addMsg(text, "user");
    botReply(answer(text));
  }

  function open() {
    teaser.hidden = true;
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    if (!started) {
      started = true;
      addMsg("Hey! I am the Chai & Co concierge. Ask me about our menu and hours, or anything about chai itself.", "bot");
      renderQuick();
    }
    setTimeout(function () { input.focus(); }, 50);
  }
  function close() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  launcher.addEventListener("click", open);
  panel.querySelector(".chat-close").addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) close();
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    send(input.value);
    input.value = "";
  });

  window.chaiConcierge = {
    open: open,
    askAboutDrink: function () {
      open();
      var d = window.chaiCurrent;
      if (!d) return;
      addMsg("Tell me about the drink I just built.", "user");
      var tip = d.state.spice >= 4
        ? "It has real heat, so a cardamom shortbread on the side balances it nicely."
        : d.state.base === "kashmiri"
          ? "Kashmiri pink is gentle and nutty, so it pairs well with naan khatai."
          : "It is a great everyday cup and goes well with cake rusk for dunking.";
      botReply(d.name + " is " + d.desc.charAt(0).toLowerCase() + d.desc.slice(1) + " It comes to " + d.price + ". " + tip + " Save it and mention the name at the counter.");
    }
  };
})();
