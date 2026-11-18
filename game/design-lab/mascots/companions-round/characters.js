/* Персонажи-чиби и напарники (canvas «Маскоты · необрутализм», финал 2026-10-29).
   Один шаблон: персонаж по ключу, напарник по ключу и состоянию calm | alert | alarm.
   Цвета персонажей зашиты и от темы не зависят. Так же стоит устроить React-компоненты. */
(function () {
  var INK = '#1d1530';
  var G = 'stroke="' + INK + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';

  function sleeve(d, color) {
    return '<path d="' + d + '" fill="none" stroke-width="18"/><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="10"/>';
  }
  var eyes = '<ellipse cx="88" cy="90" rx="5" ry="7" fill="' + INK + '" stroke="none"/><ellipse cx="112" cy="90" rx="5" ry="7" fill="' + INK + '" stroke="none"/><circle cx="89.5" cy="87.5" r="1.8" fill="#fff" stroke="none"/><circle cx="113.5" cy="87.5" r="1.8" fill="#fff" stroke="none"/>';
  var grin = '<path d="M90 102 Q100 112 110 102 Z" fill="' + INK + '" stroke-width="3"/>';

  var PERSONA = {
    student:
      '<rect x="54" y="116" width="92" height="74" rx="18" fill="#4c1d95"/>' +
      '<rect x="76" y="190" width="20" height="26" fill="#5d5470"/><rect x="104" y="190" width="20" height="26" fill="#5d5470"/>' +
      '<rect x="66" y="212" width="32" height="14" rx="7" fill="#6d28d9"/><rect x="64" y="222" width="36" height="8" rx="3" fill="#fff"/>' +
      '<rect x="102" y="212" width="32" height="14" rx="7" fill="#6d28d9"/><rect x="100" y="222" width="36" height="8" rx="3" fill="#fff"/>' +
      sleeve('M68 136 Q52 150 58 168', '#6d28d9') + '<circle cx="59" cy="172" r="8" fill="#f6c9a0"/>' +
      '<path d="M68 128 Q70 116 100 116 Q130 116 132 128 L136 194 L64 194 Z" fill="#6d28d9"/>' +
      '<path d="M82 170 L118 170 L121 188 L79 188 Z" fill="none" stroke-width="3"/>' +
      '<circle cx="100" cy="152" r="8" fill="#eab308" stroke-width="2.5"/><circle cx="100" cy="152" r="4" fill="#fcf1c8" stroke="none"/>' +
      '<path d="M74 122 L78 190 M126 122 L122 190" fill="none" stroke-width="6"/>' +
      sleeve('M132 134 Q150 124 152 106', '#6d28d9') + '<circle cx="152" cy="100" r="8" fill="#f6c9a0"/>' +
      '<circle cx="100" cy="74" r="52" fill="#6d28d9"/><ellipse cx="100" cy="80" rx="40" ry="41" fill="#4c1d95" stroke-width="3"/>' +
      '<ellipse cx="100" cy="84" rx="33" ry="34" fill="#f6c9a0" stroke-width="3"/>' +
      '<path d="M68 76 Q70 50 100 50 Q130 50 132 76 Q120 64 110 68 Q102 60 94 68 Q82 64 68 76 Z" fill="#7a4a2a" stroke-width="3"/>' +
      '<path d="M90 124 L88 140 M110 124 L112 140" fill="none" stroke="#fff" stroke-width="3"/>' +
      eyes + '<path d="M92 104 Q100 111 108 104" fill="none" stroke-width="3.5"/>',
    pro:
      '<rect x="76" y="190" width="20" height="26" fill="#5d5470"/><rect x="104" y="190" width="20" height="26" fill="#5d5470"/>' +
      '<rect x="66" y="212" width="32" height="14" rx="7" fill="#fff"/><rect x="64" y="222" width="36" height="8" rx="3" fill="' + INK + '"/>' +
      '<rect x="102" y="212" width="32" height="14" rx="7" fill="#fff"/><rect x="100" y="222" width="36" height="8" rx="3" fill="' + INK + '"/>' +
      sleeve('M68 136 Q52 150 58 168', '#eab308') + '<circle cx="59" cy="172" r="8" fill="#e8b48a"/>' +
      '<path d="M68 128 Q70 116 100 116 Q130 116 132 128 L136 194 L64 194 Z" fill="#eab308"/>' +
      '<path d="M86 118 L114 118 L116 194 L84 194 Z" fill="#fff" stroke-width="3"/>' +
      '<path d="M86 118 L90 134 L84 140 M114 118 L110 134 L116 140" fill="none" stroke-width="3"/>' +
      '<path d="M72 150 L80 150 M120 150 L128 150" fill="none" stroke-width="2.5"/>' +
      sleeve('M132 134 Q150 124 152 106', '#eab308') + '<circle cx="152" cy="100" r="8" fill="#e8b48a"/>' +
      '<circle cx="66" cy="88" r="7" fill="#e8b48a"/><circle cx="134" cy="88" r="7" fill="#e8b48a"/>' +
      '<ellipse cx="100" cy="84" rx="34" ry="35" fill="#e8b48a"/>' +
      '<path d="M66 86 Q62 52 96 46 Q104 32 122 40 Q140 52 134 86 Q128 64 112 62 Q96 62 84 60 Q72 68 66 86 Z" fill="#3d2b1f"/>' +
      '<path d="M80 78 L94 76 M106 76 L120 78" fill="none" stroke-width="3"/>' + eyes + grin,
    boss:
      '<rect x="76" y="190" width="20" height="26" fill="#4c1d95"/><rect x="104" y="190" width="20" height="26" fill="#4c1d95"/>' +
      '<path d="M64 228 Q64 214 78 214 L92 214 Q98 214 98 228 Z" fill="' + INK + '"/><path d="M102 228 Q102 214 108 214 L122 214 Q136 214 136 228 Z" fill="' + INK + '"/>' +
      sleeve('M68 136 Q48 150 64 168', '#4c1d95') + '<circle cx="66" cy="170" r="8" fill="#e8b48a"/>' +
      '<path d="M68 128 Q70 116 100 116 Q130 116 132 128 L136 194 L64 194 Z" fill="#4c1d95"/>' +
      '<path d="M86 116 L100 152 L114 116 Z" fill="#fff" stroke-width="3"/>' +
      '<path d="M96 122 L104 122 L107 144 L100 152 L93 144 Z" fill="#eab308" stroke-width="2.5"/>' +
      '<path d="M86 116 L94 158 M114 116 L106 158" fill="none" stroke-width="3"/>' +
      sleeve('M132 134 Q150 124 152 106', '#4c1d95') + '<circle cx="152" cy="100" r="8" fill="#e8b48a"/>' +
      '<circle cx="66" cy="88" r="7" fill="#e8b48a"/><circle cx="134" cy="88" r="7" fill="#e8b48a"/>' +
      '<path d="M66 80 Q66 50 100 50 Q134 50 134 80 L132 100 Q128 118 100 120 Q72 118 68 100 Z" fill="#e8b48a"/>' +
      '<path d="M67 76 Q64 44 100 44 Q136 44 133 76 Q129 60 118 58 Q102 62 88 56 Q74 60 67 76 Z" fill="#2b2238"/>' +
      '<path d="M88 56 L90 46" fill="none" stroke="#e8b48a" stroke-width="2.5"/>' +
      '<path d="M68 74 L68 88 M132 74 L132 88" fill="none" stroke="#2b2238" stroke-width="5"/>' +
      '<path d="M79 78 L95 76 M105 76 L121 78" fill="none" stroke-width="4.5"/>' + eyes +
      '<path d="M88 102 Q100 113 112 102 Z" fill="' + INK + '" stroke-width="3"/>',
    biz:
      '<rect x="76" y="190" width="20" height="26" fill="#5d5470"/><rect x="104" y="190" width="20" height="26" fill="#5d5470"/>' +
      '<rect x="66" y="212" width="32" height="14" rx="7" fill="#fff"/><rect x="64" y="222" width="36" height="8" rx="3" fill="#6d28d9"/>' +
      '<rect x="102" y="212" width="32" height="14" rx="7" fill="#fff"/><rect x="100" y="222" width="36" height="8" rx="3" fill="#6d28d9"/>' +
      sleeve('M68 136 Q48 150 64 168', '#6d28d9') + '<circle cx="66" cy="170" r="8" fill="#d99a6c"/>' +
      '<path d="M68 128 Q70 116 100 116 Q130 116 132 128 L136 194 L64 194 Z" fill="#6d28d9"/>' +
      '<path d="M86 118 L114 118 L116 194 L84 194 Z" fill="#fff" stroke-width="3"/>' +
      '<circle cx="100" cy="150" r="7" fill="#eab308" stroke-width="2.5"/><circle cx="100" cy="150" r="3.5" fill="#fcf1c8" stroke="none"/>' +
      '<path d="M86 118 L92 152 M114 118 L108 152" fill="none" stroke-width="3"/>' +
      sleeve('M132 134 Q150 124 152 106', '#6d28d9') + '<circle cx="152" cy="100" r="8" fill="#d99a6c"/>' +
      '<circle cx="100" cy="40" r="14" fill="#7a4a2a"/>' +
      '<circle cx="66" cy="88" r="7" fill="#d99a6c"/><circle cx="134" cy="88" r="7" fill="#d99a6c"/>' +
      '<ellipse cx="100" cy="84" rx="34" ry="35" fill="#d99a6c"/>' +
      '<path d="M66 86 Q62 52 100 50 Q138 52 134 86 Q128 66 100 64 Q74 66 66 86 Z" fill="#7a4a2a"/>' +
      '<path d="M78 66 Q86 76 96 64" fill="#7a4a2a" stroke-width="3"/>' +
      '<circle cx="66" cy="98" r="3" fill="#eab308" stroke-width="2"/><circle cx="134" cy="98" r="3" fill="#eab308" stroke-width="2"/>' +
      eyes + grin
  };

  /* ---- Напарники: viewBox 0 0 160 180, состояние меняет лицо и одну деталь ---- */
  function feet(y) {
    return '<path d="M64 ' + (y - 18) + ' L62 ' + y + ' M96 ' + (y - 18) + ' L98 ' + y + '" fill="none" stroke-width="4.5"/>' +
      '<path d="M46 ' + (y + 10) + ' Q46 ' + y + ' 56 ' + y + ' L64 ' + y + ' Q68 ' + y + ' 68 ' + (y + 10) + ' Z" fill="' + INK + '"/>' +
      '<path d="M92 ' + (y + 10) + ' Q92 ' + y + ' 96 ' + y + ' L104 ' + y + ' Q114 ' + y + ' 114 ' + (y + 10) + ' Z" fill="' + INK + '"/>';
  }
  function hand(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="7" fill="#fcf1c8"/>'; }
  function drop(x, y) { return '<path d="M' + x + ' ' + y + ' Q' + (x - 5) + ' ' + (y + 10) + ' ' + x + ' ' + (y + 13) + ' Q' + (x + 5) + ' ' + (y + 10) + ' ' + x + ' ' + y + ' Z" fill="#fff" stroke-width="2.5"/>'; }

  /* белые глаза на цветном теле: calm — смотрят прямо, alert — полуприкрыты, alarm — брови домиком */
  function whiteEyes(lx, rx, y, s, mouthY, mouthW) {
    var e = '<ellipse cx="' + lx + '" cy="' + y + '" rx="6" ry="7" fill="#fff" stroke-width="2.5"/><ellipse cx="' + rx + '" cy="' + y + '" rx="6" ry="7" fill="#fff" stroke-width="2.5"/>';
    var py = s === 'alarm' ? y + 3 : y + 2;
    e += '<circle cx="' + (lx + 1) + '" cy="' + py + '" r="3" fill="' + INK + '" stroke="none"/><circle cx="' + (rx + 1) + '" cy="' + py + '" r="3" fill="' + INK + '" stroke="none"/>';
    if (s === 'alert') e += '<path d="M' + (lx - 7) + ' ' + (y - 3) + ' L' + (lx + 7) + ' ' + (y - 3) + ' M' + (rx - 7) + ' ' + (y - 3) + ' L' + (rx + 7) + ' ' + (y - 3) + '" fill="none" stroke-width="3"/>';
    if (s === 'alarm') e += '<path d="M' + (lx - 8) + ' ' + (y - 8) + ' L' + (lx + 6) + ' ' + (y - 12) + ' M' + (rx + 8) + ' ' + (y - 8) + ' L' + (rx - 6) + ' ' + (y - 12) + '" fill="none" stroke="#fff" stroke-width="3"/>';
    var mx = (lx + rx) / 2, h = mouthW / 2;
    var m = s === 'calm' ? 'M' + (mx - h) + ' ' + mouthY + ' Q' + mx + ' ' + (mouthY + 8) + ' ' + (mx + h) + ' ' + mouthY
      : s === 'alert' ? 'M' + (mx - h) + ' ' + (mouthY + 3) + ' L' + (mx + h) + ' ' + (mouthY + 3)
      : 'M' + (mx - h) + ' ' + (mouthY + 3) + ' Q' + (mx - h / 2) + ' ' + (mouthY - 1) + ' ' + mx + ' ' + (mouthY + 3) + ' Q' + (mx + h / 2) + ' ' + (mouthY + 7) + ' ' + (mx + h) + ' ' + (mouthY + 3);
    return e + '<path d="' + m + '" fill="none" stroke="#fff" stroke-width="3"/>';
  }

  var COMPANION = {
    studbilet: function (s) {
      var card = s === 'alarm'
        ? '<path d="M27 59 L135 59 Q143 59 143 67 L143 129 L127 145 L35 145 Q27 145 27 137 Z" fill="' + INK + '" stroke="none"/>' +
          '<path d="M30 54 L130 54 Q138 54 138 62 L138 124 L122 140 L30 140 Q22 140 22 132 L22 62 Q22 54 30 54 Z" fill="#fff"/>' +
          '<path d="M122 140 L122 124 L138 124 Z" fill="#dcf3ea" stroke-width="3"/>'
        : '<rect x="27" y="59" width="116" height="86" rx="8" fill="' + INK + '" stroke="none"/><rect x="22" y="54" width="116" height="86" rx="8" fill="#fff"/>';
      var face = s === 'calm'
        ? '<circle cx="47" cy="103" r="2" fill="' + INK + '" stroke="none"/><circle cx="55" cy="103" r="2" fill="' + INK + '" stroke="none"/><path d="M47 108 Q51 112 55 108" fill="none" stroke-width="2"/>'
        : s === 'alert'
        ? '<circle cx="47" cy="103" r="2" fill="' + INK + '" stroke="none"/><circle cx="55" cy="103" r="2" fill="' + INK + '" stroke="none"/><path d="M47 109 L55 109" fill="none" stroke-width="2"/>'
        : '<path d="M43 98 L49 96 M59 98 L53 96" fill="none" stroke-width="1.8"/><circle cx="47" cy="103" r="1.7" fill="' + INK + '" stroke="none"/><circle cx="55" cy="103" r="1.7" fill="' + INK + '" stroke="none"/><path d="M46 110 Q48.5 107 51 110 Q53.5 113 56 110" fill="none" stroke-width="2"/>';
      return '<path d="M56 56 Q80 16 104 56" fill="none" stroke="#047857" stroke-width="6"/>' + feet(158) +
        '<path d="M22 100 Q8 92 10 76" fill="none" stroke-width="4.5"/>' + hand(10, 70) +
        '<path d="M138 104 Q152 112 148 128" fill="none" stroke-width="4.5"/>' + hand(147, 134) + card +
        '<path d="M24 70 L24 62 Q24 56 30 56 L130 56 Q136 56 136 62 L136 70 Z" fill="#047857" stroke="none"/><path d="M22 70 L138 70" fill="none" stroke-width="3"/>' +
        '<rect x="32" y="78" width="38" height="52" rx="3" fill="#dcf3ea" stroke-width="3"/>' +
        '<path d="M36 130 Q38 116 51 116 Q64 116 66 130 Z" fill="#6d28d9" stroke-width="2.5"/>' +
        '<circle cx="51" cy="101" r="12" fill="#f6c9a0" stroke-width="2.5"/>' +
        '<path d="M39 100 Q38 87 51 87 Q64 87 63 100 Q58 93 51 95 Q44 93 39 100 Z" fill="#7a4a2a" stroke-width="2.5"/>' + face +
        '<path d="M80 86 L126 86" fill="none" stroke-width="4"/><path d="M80 98 L118 98 M80 108 L122 108" fill="none" stroke="#71688a" stroke-width="3"/>' +
        (s === 'alarm' ? '' : '<circle cx="120" cy="124" r="9" fill="#eab308" stroke-width="2.5"/><circle cx="120" cy="124" r="4.5" fill="#fcf1c8" stroke="none"/>') +
        (s === 'alarm' ? drop(148, 40) : '');
    },
    card: function (s) {
      return feet(156) +
        '<path d="M18 92 Q4 84 6 68" fill="none" stroke-width="4.5"/>' + hand(6, 62) +
        '<path d="M142 98 Q156 106 152 122" fill="none" stroke-width="4.5"/>' + hand(151, 128) +
        '<rect x="23" y="63" width="124" height="80" rx="10" fill="' + INK + '" stroke="none"/>' +
        '<rect x="18" y="58" width="124" height="80" rx="10" fill="#6d28d9"/>' +
        '<rect x="30" y="72" width="24" height="18" rx="4" fill="' + (s === 'alarm' ? '#b4abc6' : '#eab308') + '" stroke-width="2.5"/>' +
        '<path d="M30 81 L54 81 M42 72 L42 90" fill="none" stroke-width="1.5"/>' +
        (s === 'calm' ? '<path d="M116 70 Q122 76 116 82 M123 66 Q131 76 123 86" fill="none" stroke="#fff" stroke-width="2.5"/>' : '') +
        (s === 'alert' ? '<path d="M116 70 Q122 76 116 82" fill="none" stroke="#fff" stroke-width="2.5"/>' : '') +
        whiteEyes(74, 100, 98, s, 112, 16) +
        '<path d="M30 126 L50 126 M56 126 L76 126" fill="none" stroke="#ece4fb" stroke-width="3" stroke-dasharray="3 3" stroke-linecap="butt"/>' +
        (s === 'alarm' ? drop(150, 40) : '');
    },
    briefcase: function (s) {
      var papers = '<rect x="38" y="44" width="28" height="22" fill="#fff" stroke-width="3" transform="rotate(-12 52 55)"/>';
      if (s !== 'calm') papers += '<rect x="96" y="46" width="26" height="20" fill="#fff" stroke-width="3" transform="rotate(10 109 56)"/>';
      if (s === 'alarm') papers += '<rect x="66" y="36" width="24" height="22" fill="#fff" stroke-width="3" transform="rotate(-4 78 47)"/>';
      return feet(156) +
        '<path d="M24 100 Q8 94 8 76" fill="none" stroke-width="4.5"/>' + hand(8, 70) +
        '<path d="M136 104 Q152 112 148 128" fill="none" stroke-width="4.5"/>' + hand(147, 134) +
        '<path d="M64 58 L64 46 Q64 40 70 40 L90 40 Q96 40 96 46 L96 58" fill="none" stroke-width="5"/>' + papers +
        '<rect x="29" y="63" width="112" height="80" rx="10" fill="' + INK + '" stroke="none"/>' +
        '<rect x="24" y="58" width="112" height="80" rx="10" fill="#7a4a2a"/>' +
        '<path d="M24 86 L136 86" fill="none" stroke-width="3"/>' +
        '<path d="M36 64 L36 132 M124 64 L124 132" fill="none" stroke="#5c3720" stroke-width="2.5" stroke-dasharray="3 4"/>' +
        whiteEyes(56, 104, 72, s, 108, 24).replace(/stroke="#fff" stroke-width="3"\/>$/, 'stroke="#fcf1c8" stroke-width="3"/>') +
        '<rect x="70" y="79" width="20" height="14" rx="3" fill="#eab308" stroke-width="3"/>' +
        (s === 'alarm' ? drop(146, 40) : '');
    },
    phone: function (s) {
      var badge = s === 'alert'
        ? '<circle cx="112" cy="32" r="11" fill="#eab308" stroke-width="3"/><text x="112" y="37" text-anchor="middle" class="cmp-badge" fill="' + INK + '" stroke="none">2</text>'
        : s === 'alarm'
        ? '<circle cx="112" cy="32" r="11" fill="#c81e1e" stroke-width="3"/><path d="M112 26 L112 33 M112 37.5 L112 38" fill="none" stroke="#fff" stroke-width="3"/>'
        : '';
      var buzz = s === 'calm' ? '' : '<path d="M30 56 L24 62 M30 70 L24 76 M130 56 L136 62 M130 70 L136 76" fill="none" stroke-width="3"/>';
      if (s === 'alarm') buzz += '<path d="M30 84 L24 90 M130 84 L136 90" fill="none" stroke-width="3"/>';
      var face = s === 'calm'
        ? '<circle cx="70" cy="70" r="5" fill="' + INK + '" stroke="none"/><circle cx="90" cy="70" r="5" fill="' + INK + '" stroke="none"/><path d="M72 86 Q80 93 88 86" fill="none" stroke-width="3"/>'
        : s === 'alert'
        ? '<circle cx="70" cy="72" r="4.5" fill="' + INK + '" stroke="none"/><circle cx="90" cy="72" r="4.5" fill="' + INK + '" stroke="none"/><path d="M63 66 L77 66 M83 66 L97 66" fill="none" stroke-width="3"/><path d="M72 88 L88 88" fill="none" stroke-width="3"/>'
        : '<path d="M62 62 L76 58 M98 62 L84 58" fill="none" stroke-width="3"/><circle cx="70" cy="72" r="4" fill="' + INK + '" stroke="none"/><circle cx="90" cy="72" r="4" fill="' + INK + '" stroke="none"/><path d="M71 88 Q75.5 84 80 88 Q84.5 92 89 88" fill="none" stroke-width="3"/>';
      return feet(160) +
        '<path d="M46 96 Q28 92 26 74" fill="none" stroke-width="4.5"/>' + hand(26, 68) +
        '<path d="M114 100 Q132 108 128 124" fill="none" stroke-width="4.5"/>' + hand(127, 130) + buzz +
        '<rect x="51" y="35" width="68" height="112" rx="12" fill="' + INK + '" stroke="none"/>' +
        '<rect x="46" y="30" width="68" height="112" rx="12" fill="#eab308"/>' +
        '<rect x="52" y="40" width="56" height="94" rx="6" fill="#fff" stroke-width="3"/>' +
        '<rect x="70" y="34" width="20" height="3" rx="1.5" fill="' + INK + '" stroke="none"/>' +
        '<rect x="58" y="104" width="44" height="10" rx="5" fill="#ece4fb" stroke-width="2.5"/>' +
        (s === 'calm' ? '' : '<rect x="58" y="118" width="32" height="10" rx="5" fill="' + (s === 'alarm' ? '#c81e1e' : '#6d28d9') + '" stroke-width="2.5"/>') +
        face + badge;
    }
  };

  window.TH_CHARACTERS = {
    persona: function (key, label, viewBox) {
      return '<svg viewBox="' + (viewBox || '0 0 200 250') + '" role="img" aria-label="' + label + '"><g ' + G + '>' + PERSONA[key] + '</g></svg>';
    },
    companion: function (key, state, label) {
      return '<svg viewBox="0 0 160 180" role="img" aria-label="' + label + '"><g ' + G + '>' + COMPANION[key](state || 'calm') + '</g></svg>';
    }
  };
})();
