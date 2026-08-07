const CHEST_SVG={
 evo:'<svg viewBox="0 0 32 32"><path d="M16 3l3.2 9.6L29 16l-9.8 3.4L16 29l-3.2-9.6L3 16l9.8-3.4z"/></svg>',
 wlvl:'<svg viewBox="0 0 32 32"><path d="M7 25 21 11m-3 0 4-4 7 7-4 4M4 28l7-1.5-5.5-5.5z"/></svg>',
 gold:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10"/><path d="M16 10v12M12.5 13h5.5a2.5 2.5 0 010 5h-4a2.5 2.5 0 000 5h5"/></svg>',
 heal:'<svg viewBox="0 0 32 32"><path d="M16 27S5 20 5 13a6 6 0 0111-3 6 6 0 0111 3c0 7-11 14-11 14z"/></svg>',
 maxhp:'<svg viewBox="0 0 32 32"><path d="M16 5v22M5 16h22"/><circle cx="16" cy="16" r="12"/></svg>',
 pickup:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="4"/><circle cx="16" cy="16" r="11" stroke-dasharray="3 4"/></svg>'
};
// ============================================================================
// ===== v7.5+ MODULAR AI ART PACK (МОДУЛЬНЫЙ ПАК АРТОВ И ТЕКСТУР) =============
// Вы можете легко вырезать этот блок целиком и скопировать в любую версию игры.
// Все три константы автономны и хранят оптимизированный WebP Base64:
//   1. CHEST_ART       — арт славянского ларца (сундук в UI и в мире игры)
//   2. AURA_ART_IDOL   — текстура рунической мандалы Идола (аналог Чеснока)
//   3. TAROT_FRAME_ART — арт дубовой скрижали для карточек выбора уровня
// ============================================================================
// v7.2: НАРИСОВАННАЯ ГЕНЕРАЦИЕЙ ИЛЛЮСТРАЦИЯ СУНДУКА (настоящий арт вместо кода)
const CHEST_ART={ src: '@@A:art/art-registry/chest-art.webp@@' };
// v7.5: НАРИСОВАННЫЙ ГЕНЕРАЦИЕЙ АРТ СЛАВЯНСКОЙ РУНИЧЕСКОЙ МАНДАЛЫ
const AURA_ART_IDOL=(function(){const i=new Image();i.src='@@A:art/art-registry/aura-art-idol.webp@@';return i;})();

// v7.4: НАРИСОВАННАЯ ГЕНЕРАЦИЕЙ РАМКА СЛАВЯНСКОЙ ТАРО-СКРИЖАЛИ
const TAROT_FRAME_ART={ src: '@@A:art/art-registry/tarot-frame-art.webp@@' };// Возвращает готовую к пробуждению ауру или орудие (или null), НЕ применяя.
// ============================================================================
// ============================================================================

// v7.6: НАРИСОВАННЫЕ ГЕНЕРАЦИЕЙ ЛЕСНЫЕ ДЕКОРАЦИИ (пни, святилища, камни — арт вместо линий кода)
const PROPS_ART_SHEET=(function(){const i=new Image();i.src='@@A:art/art-registry/props-art-sheet.webp@@';return i;})();
// v7.6: НАРИСОВАННЫЕ ГЕНЕРАЦИЕЙ ИКОНКИ РЕЛИКВИЙ И ОРУЖИЯ (арт вместо векторных SVG)
const ICONS_ART_SHEET={ src: '@@A:art/art-registry/icons-art-sheet.webp@@' };

// v7.7: НАРИСОВАННЫЕ ГЕНЕРАЦИЕЙ ТЕКСТУРЫ СНАРЯДОВ И МАГИИ (стрелы, молнии, шипы стужи)
const PROJECTILES_ART_SHEET=(function(){const i=new Image();i.src='@@A:art/art-registry/projectiles-art-sheet.webp@@';return i;})();
// v7.7: НАРИСОВАННЫЙ ГЕНЕРАЦИЕЙ СВЯЩЕННЫЙ АЛТАРЬ ПРОБУЖДЕНИЯ (для экрана Эволюций)
const EVO_ALTAR_ART={ src: '@@A:art/art-registry/evo-altar-art.webp@@' };

const VICTORY_SHIELD_ART={ src: '@@A:art/art-registry/victory-shield-art.webp@@' };
// v7.17: 8-КАДРОВЫЙ АТЛАС СЛАВЯНСКОГО ВЗМАХА МЕЧА (с хромакея Magenta #FF00FF в 100% прозрачный альфа-канал)
// Сетка строго 4x2 по 160px, как у остальных атласов эффектов — код везде режет лист как naturalWidth/4 x naturalHeight/2.
// Исходник на magenta лежит в assets/art/_chromakey-src/, пересобирается через tools/chromakey.py.
const SLASH_ANIM_SHEET=(function(){const i=new Image();i.src='@@A:art/art-registry/slash-anim-sheet.webp@@';return i;})();
// v7.20: 8-КАДРОВЫЙ АТЛАС МОРОЗНО-ТРАВЯНОЙ ВОЛНЫ ЗНАХАРКИ (с хромакея Magenta #FF00FF в 100% прозрачный альфа-канал)
const DRUID_WAVE_SHEET=(function(){const i=new Image();i.src='@@A:art/art-registry/druid-wave-sheet.webp@@';return i;})();
// v7.20: 8-КАДРОВЫЙ АТЛАС ТЕНЕВОГО СЕРПА ВОРОННИКА (с хромакея Magenta #FF00FF в 100% прозрачный альфа-канал)
const ROGUE_SLASH_SHEET=(function(){const i=new Image();i.src='@@A:art/art-registry/rogue-slash-sheet.webp@@';return i;})();
// v7.22: НАРИСОВАННОЕ ГЕНЕРАЦИЕЙ СВЯТИЛИЩЕ ЛЕСНОГО ПРОБУЖДЕНИЯ (аномия Алтаря в мире на земле без рамок и фона)
const ALTAR_WORLD_PROP_ART = (function(){const i=new Image(); i.src='@@A:art/art-registry/altar-world-prop-art.webp@@'; return i;})();
// v7.24: НАРИСОВАННАЯ ГЕНЕРАЦИЕЙ СЛАВЯНСКАЯ ЗОЛОТАЯ ЖИЛА (аномия Жили в мире на земле без рамок и фона)
const GOLD_VEIN_WORLD_PROP_ART = (function(){const i=new Image(); i.src='@@A:art/art-registry/gold-vein-world-prop-art.webp@@'; return i;})();
// v7.25: НАРИСОВАННАЯ ГЕНЕРАЦИЕЙ СЛАВЯНСКАЯ ЗОЛОТАЯ ГРИВНА / МОНЕТА (для падающих монет и золота без рисования кодом)
const COIN_DROP_ART = (function(){const i=new Image(); i.src='@@A:art/art-registry/coin-drop-art.webp@@'; return i;})();
// v7.26: 5 Новых AI-Ассетов для искоренения оставшихся примитивов из кода (Идол, Волк, Орбита, Вихрь, Оберег)
const IDOL_WORLD_PROP_ART = (function(){const i=new Image(); i.src='@@A:art/art-registry/idol-world-prop-art.webp@@'; return i;})();
const WOLF_SPIRIT_ART = (function(){const i=new Image(); i.src='@@A:art/art-registry/wolf-spirit-art.webp@@'; return i;})();
const RAVEN_ORB_ART = (function(){const i=new Image(); i.src='@@A:art/art-registry/raven-orb-art.webp@@'; return i;})();
const VIHR_VORTEX_SHEET = (function(){const i=new Image(); i.src='@@A:art/art-registry/vihr-vortex-sheet.webp@@'; return i;})();
const OBEREG_SHIELD_ART = (function(){const i=new Image(); i.src='@@A:art/art-registry/obereg-shield-art.webp@@'; return i;})();
// v7.27: 4 Новые AI-Текстуры для искоренения примитивов наземных зон оружия (Колокол, Роса Мокоши, Зерно, Венец)
const KOLOKOL_AURA_ART = (function(){const i=new Image(); i.src='@@A:art/art-registry/kolokol-aura-art.webp@@'; return i;})();
const ROSA_AURA_ART    = (function(){const i=new Image(); i.src='@@A:art/art-registry/rosa-aura-art.webp@@'; return i;})();
const ZERNO_AURA_ART   = (function(){const i=new Image(); i.src='@@A:art/art-registry/zerno-aura-art.webp@@'; return i;})();
const CROWN_AURA_ART   = (function(){const i=new Image(); i.src='@@A:art/art-registry/crown-aura-art.webp@@'; return i;})();
// v7.29: 3 Новых AI-Ассета для искоренения примитивов Ловушек, Косы Мораны и Q-Печати
const HAZARD_TRAP_ART    = (function(){const i=new Image(); i.src='@@A:art/art-registry/hazard-trap-art.webp@@'; return i;})();
const KOSA_TRAIL_SHEET   = (function(){const i=new Image(); i.src='@@A:art/art-registry/kosa-trail-sheet.webp@@'; return i;})();
const ULT_SEAL_MANDALA_ART = (function(){const i=new Image(); i.src='@@A:art/art-registry/ult-seal-mandala-art.webp@@'; return i;})();
// v7.30: 3 Новых AI-Ассета Боссов («Хранитель Чащи», «Волк-Вожак», «Леший-Владыка») без чёрных рамок
const BOSS_HRANITEL_ART = (function(){const i=new Image(); i.src='@@A:art/art-registry/boss-hranitel-art.webp@@'; return i;})();
const BOSS_VOLK_ART     = (function(){const i=new Image(); i.src='@@A:art/art-registry/boss-volk-art.webp@@'; return i;})();
const BOSS_LESHIY_ART   = (function(){const i=new Image(); i.src='@@A:art/art-registry/boss-leshiy-art.webp@@'; return i;})();
// v7.31: 4 Новых 8-кадровых AI-Атласа Анимации (Змей Горыныч, Волк-Вожак, Леший-Владыка, Призрачный Волк Велеса)
const BOSS_HRANITEL_SHEET = (function(){const i=new Image(); i.src='@@A:art/art-registry/boss-hranitel-sheet.webp@@'; return i;})();
const BOSS_VOLK_SHEET     = (function(){const i=new Image(); i.src='@@A:art/art-registry/boss-volk-sheet.webp@@'; return i;})();
const BOSS_LESHIY_SHEET   = (function(){const i=new Image(); i.src='@@A:art/art-registry/boss-leshiy-sheet.webp@@'; return i;})();
const WOLF_SPIRIT_SHEET   = (function(){const i=new Image(); i.src='@@A:art/art-registry/wolf-spirit-sheet.webp@@'; return i;})();
// v7.11: 8-КАДРОВЫЙ АТЛАС МАГИЧЕСКОГО ВЗРЫВА (с хромакея Magenta #FF00FF в 100% прозрачный альфа-канал)
const EXPLOSION_ANIM_SHEET=(function(){const i=new Image();i.src='@@A:art/art-registry/explosion-anim-sheet.webp@@';return i;})();
// v7.12: 8-КАДРОВЫЙ АТЛАС УДАРА МОЛНИИ (с хромакея Magenta #FF00FF в 100% прозрачный альфа-канал)
const LIGHTNING_ANIM_SHEET=(function(){const i=new Image();i.src='@@A:art/art-registry/lightning-anim-sheet.webp@@';return i;})();
// v7.13: 8-КАДРОВЫЙ АТЛАС ЯДОВИТОГО ОБЛАКА (с хромакея Magenta #FF00FF в 100% прозрачный альфа-канал)
const POISON_ANIM_SHEET=(function(){const i=new Image();i.src='@@A:art/art-registry/poison-anim-sheet.webp@@';return i;})();
const FROST_SPIKE_ANIM_SHEET=(function(){const i=new Image();i.src='@@A:art/art-registry/frost-spike-anim-sheet.webp@@';return i;})();
// v7.15: 8-КАДРОВЫЙ АТЛАС ОГНЕННОГО ШАРА И ПЕПЛА (с хромакея Magenta #FF00FF в 100% прозрачный альфа-канал)
const FIREBALL_ANIM_SHEET=(function(){const i=new Image();i.src='@@A:art/art-registry/fireball-anim-sheet.webp@@';return i;})();
const activeExplosions=[];

// v7.34: три листа, очищенных от magenta в v7.32. Подключены точечно:
// дымный серп — зона Косы, звёздная вспышка — крит, пыльный столб — смерть крупного.
const SLASH_SMOKE_SHEET  = (function(){const i=new Image(); i.src='@@A:art/art-registry/slash-smoke-sheet.webp@@'; return i;})();
const IMPACT_BURST_SHEET = (function(){const i=new Image(); i.src='@@A:art/art-registry/impact-burst-sheet.webp@@'; return i;})();
const DUST_PLUME_SHEET   = (function(){const i=new Image(); i.src='@@A:art/art-registry/dust-plume-sheet.webp@@'; return i;})();

// Фон экрана выбора божества — тёмный славянский лес с виньеткой.
const BOON_BG_ART=(function(){const i=new Image();i.src='@@A:art/boon-bg.webp@@';return i;})();

// v7.35: листы, нарисованные под зоны оружия по заданиям из docs/art-briefs.md.
// Мятный клин — взмах Косы Моры, рваный саван — Навий хвост.
const KOSA_ZONE_SHEET    = (function(){const i=new Image(); i.src='@@A:art/art-registry/kosa-zone-sheet.webp@@'; return i;})();
const KOSTI_ZONE_SHEET     = (function(){const i=new Image(); i.src='@@A:art/art-registry/kosti-zone-sheet.webp@@'; return i;})();
const ZERCALO_ZONE_SHEET   = (function(){const i=new Image(); i.src='@@A:art/art-registry/zercalo-zone-sheet.webp@@'; return i;})();
const KOLOKOL_ZONE_SHEET   = (function(){const i=new Image(); i.src='@@A:art/art-registry/kolokol-zone-sheet.webp@@'; return i;})();
const ZERNO_ZONE_SHEET     = (function(){const i=new Image(); i.src='@@A:art/art-registry/zerno-zone-sheet.webp@@'; return i;})();
const KLYUKA_ZONE_SHEET    = (function(){const i=new Image(); i.src='@@A:art/art-registry/klyuka-zone-sheet.webp@@'; return i;})();
const NAVI_ZONE_SHEET    = (function(){const i=new Image(); i.src='@@A:art/art-registry/navi-zone-sheet.webp@@'; return i;})();
