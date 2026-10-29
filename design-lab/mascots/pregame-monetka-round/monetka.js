/* Монетка в «Чернильном крае» — тот же шаблон, что в mascots/ink-mascots-round:
   лицо + руки + надпись сверху на ободе, снизу всегда «★ ТВОЙ ХОД ★». Надпись читается от 120 px;
   мельче — вариант без рук и без надписи (rim: false). */
(function () {
  var INK = '#1d1530', COIN = '#eab308', SOFT = '#fcf1c8', TURN = '#6d28d9', TURN_SOFT = '#ece4fb';
  var FACES = {
    smile: '<ellipse cx="87" cy="82" rx="5" ry="8" fill="' + INK + '" stroke="none"/><ellipse cx="113" cy="82" rx="5" ry="8" fill="' + INK + '" stroke="none"/><path d="M87 100 Q100 111 113 100" fill="none" stroke-width="4.5"/>',
    wink: '<ellipse cx="87" cy="82" rx="5" ry="8" fill="' + INK + '" stroke="none"/><path d="M106 84 Q113 76 120 84" fill="none" stroke-width="4.5"/><path d="M84 98 Q100 116 116 98 Z" fill="' + INK + '" stroke-width="3"/>',
    think: '<ellipse cx="91" cy="77" rx="4.5" ry="7" fill="' + INK + '" stroke="none"/><ellipse cx="116" cy="77" rx="4.5" ry="7" fill="' + INK + '" stroke="none"/><path d="M92 104 L108 101" fill="none" stroke-width="4.5"/>',
    joy: '<path d="M80 84 L87 76 L94 84" fill="none" stroke-width="4.5"/><path d="M106 84 L113 76 L120 84" fill="none" stroke-width="4.5"/><path d="M86 96 Q100 114 114 96 Z" fill="' + INK + '" stroke-width="3"/>'
  };
  function hand(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + SOFT + '"/>'; }
  var ARMS = {
    none: { back: '', front: '' },
    wave: { back: '<path d="M44 96 Q24 88 28 62" fill="none"/>' + hand(28, 55) + '<path d="M154 102 Q178 114 160 130" fill="none"/>' + hand(157, 133), front: '' },
    thumb: { back: '<path d="M46 96 Q26 92 30 70" fill="none"/><rect x="26" y="40" width="9" height="18" rx="4.5" fill="' + SOFT + '"/><rect x="20" y="54" width="22" height="18" rx="7" fill="' + SOFT + '"/><path d="M154 102 Q178 114 160 130" fill="none"/>' + hand(157, 133), front: '' },
    up: { back: '<path d="M46 80 Q26 66 28 44" fill="none"/>' + hand(28, 37) + '<path d="M154 80 Q174 66 172 44" fill="none"/>' + hand(172, 37), front: '' },
    chin: { back: '<path d="M44 102 Q30 122 38 142" fill="none"/>' + hand(39, 149), front: '<path d="M158 106 Q150 132 124 126" fill="none"/>' + hand(118, 123) }
  };
  var uid = 0;

  window.TH_MONETKA = function (opts) {
    var id = 'pgm' + (uid++);
    var a = ARMS[opts.arms] || ARMS.none;
    var full = opts.arms && opts.arms !== 'none';
    var vb = full ? '0 0 200 210' : '30 20 140 140';
    var legs = full
      ? '<path d="M86 146 L82 182" fill="none"/><path d="M114 146 L118 182" fill="none"/><path d="M64 192 Q64 180 78 180 L86 180 Q92 180 92 192 Z" fill="' + INK + '"/><path d="M108 192 Q108 180 114 180 L122 180 Q136 180 136 192 Z" fill="' + INK + '"/>'
      : '';
    var rim = opts.rim === false ? '' :
      '<text class="pg-rim" font-size="9" fill="#ffffff" letter-spacing="1.4"><textPath href="#' + id + 't" startOffset="50%" text-anchor="middle">' + opts.top + '</textPath></text>' +
      '<text class="pg-rim" font-size="7.5" fill="' + TURN_SOFT + '" letter-spacing="1.6"><textPath href="#' + id + 'b" startOffset="50%" text-anchor="middle">★ ТВОЙ ХОД ★</textPath></text>';
    return '<svg viewBox="' + vb + '" role="img" aria-label="' + (opts.label || 'Монетка') + '">' +
      '<path id="' + id + 't" d="M55.5 88 A44.5 44.5 0 0 1 144.5 88" fill="none"/>' +
      '<path id="' + id + 'b" d="M50 88 A50 50 0 0 0 150 88" fill="none"/>' +
      '<g stroke="' + INK + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
      legs + a.back +
      '<circle cx="108" cy="96" r="62" fill="' + INK + '" stroke="none"/>' +
      '<circle cx="100" cy="88" r="62" fill="' + COIN + '"/>' +
      '<circle cx="100" cy="88" r="47" fill="' + SOFT + '" stroke="' + TURN + '" stroke-width="12"/>' +
      '<circle cx="100" cy="88" r="53.5" fill="none" stroke-width="3"/>' +
      '<circle cx="100" cy="88" r="40.5" fill="none" stroke-width="3"/>' +
      FACES[opts.face || 'smile'] + a.front + '</g>' + rim + '</svg>';
  };
})();
