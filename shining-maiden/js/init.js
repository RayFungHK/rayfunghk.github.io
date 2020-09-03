(function(contaxt) {
  var fn = {},
    draggedCard,
    evt = {},
    character = {
      agnes: {
        name: '艾格尼絲',
        id: '101',
        code: 'agnes'
      },
      anne: {
        name: '安妮',
        id: '010',
        code: 'anne'
      },
      apis: {
        name: '阿比斯',
        id: '302',
        code: 'apis'
      },
      charles: {
        name: '查爾斯',
        id: '011',
        code: 'charles'
      },
    };

  evt.onMergeable = function(element) {
    var elem = __(element),
      rank = parseInt(elem.data('rank')) || 0,
      cursed = parseInt(elem.data('cursed')) || 0;

    if (elem.length) {
      if (elem.hasClass('freeze')) {
        return false;
      }
    }

    return true;
  };

  evt.onDragable = function(element) {
    var elem = __(element);
    if (elem.length) {
      if (elem.hasClass('freeze')) {
        return false;
      }
    }

    return true;
  };

  evt.onReverseDropable = function(element) {
    var elem = __(element);
    if (elem.length) {
      if (elem.hasClass('freeze')) {
        return false;
      }
    }

    return true;
  };

  evt.onCompare = function(src, target) {
    var src = __(src),
      srcRank = parseInt(src.data('rank')) || 0,
      srcCursed = parseInt(src.data('cursed')) || 0,
      target = __(target),
      targetRank = parseInt(target.data('rank')) || 0,
      targetCursed = parseInt(target.data('cursed')) || 0;

    return (srcRank + srcCursed + targetRank + targetCursed) <= 3;
  };

  evt.onMergeTo = function(src, target) {
    var src = __(src),
      srcCursed = parseInt(src.data('cursed')) || 0,
      target = __(target),
      targetCursed = parseInt(target.data('cursed')) || 0;

    target.data('cursed', srcCursed + targetCursed)
    if (srcCursed + targetCursed > 0) {
      target.addClass('cursed')
    }
  };

  evt.onGetRank = function(element) {
    var elem = __(element),
      rank = parseInt(elem.data('rank')) || 0,
      cursed = parseInt(elem.data('cursed')) || 0;

    return rank + cursed;
  };

  evt.onGetMaxRank = function(element) {
    var elem = __(element),
      cursed = parseInt(elem.data('cursed')) || 0;

    return 3 - cursed;
  };

  evt.onDrawRank = function(element) {
    var elem = __(element),
      cursed = parseInt(elem.data('cursed')) || 0;

    return '<span class="cursed">' + ('★'.repeat(cursed) + '</span>');
  };

  evt.onReset = function() {
    __('#reserve-slot').html('')
  };

  fn.setupCard = function(element) {
    var x = 0,
      y = 0;

    __(element).dragable({
      start: function() {
        var elem = __(this);
        if (elem.parent('#section-card').length && evt.onDragable(elem)) {
          elem.addClass('grabbing');
          draggedCard = this;
        }
      },
      end: function() {
        if (draggedCard) {
          var elem = __(this);
          elem.removeClass('grabbing');
          draggedCard = null;
          fn.mergeCard(__('#section-card .card:first-child'));
        }
      },
    }).dropable({
      over: function(e) {
        if (draggedCard && draggedCard != e.toElement) {
          if (x != e.screenX || y != e.screenY) {
            x = e.screenX;
            y = e.screenY;
            var target = __(e.toElement);
            if (target.parent('#section-card').length) {
              // Insert Before
              if (e.offsetX <= 20) {
                if (!target.prev().is(draggedCard)) {
                  target.before(draggedCard);
                }
              } else {
                if (!target.next().is(draggedCard)) {
                  target.after(draggedCard);
                }
              }
            }
          }
        }
      },
      drop: function(e) {
        if (draggedCard) {
          // Event: onDrop
          var target = __(e.toElement);
          if (target.parent('#reserve-slot').length) {
            target.detach();
            __('#reserve-slot').append(draggedCard)
          }
        }
      }
    });
  };

  fn.mergeCard = function(element, fill) {
    var src = __(element),
      rank = evt.onGetRank(src),
      rankCount = parseInt(src.data('rank')) || 0,
      id = src.data('id'),
      next = src.next();

    if (next.length && src.length) {
      // Event: onMergeable
      if (rank < 3 && evt.onMergeable(next) && evt.onMergeable(src) && evt.onCompare(src, next)) {
        var nxRank = evt.onGetRank(next);
        if (next.data('id') == id && nxRank < 3) {
          var nxRankCount = parseInt(next.data('rank')) || 0;

          // Rank Transfer
          var diff = Math.min(rankCount, 3 - nxRank),
            srcRank = rankCount - diff;

          next.data('rank', (nxRankCount + diff));

          evt.onMergeTo(src, next)
          fn.drawRank(src);
          fn.drawRank(next);
          if (srcRank == 0) {
            src.css('animation', '');
            // Dispose
            src.css({
              'animation-name': 'card-merge',
              'animation-duration': '.2s',
              'animation-fill-mode': 'forwards'
            }).once('animationend', function() {
              src.detach();
              fn.mergeCard(next, fill);
            });

            return true;
          } else {
            src.data('rank', srcRank);
          }
        }
      }

      fn.mergeCard(next, fill);
    } else {
      if (fill) {
        fn.drawCard(fill);
      }
    }
  };

  fn.drawRank = function(element) {
    var elem = __(element),
      rankPoint = '';

    rankPoint = evt.onDrawRank(elem);
    rankPoint += '★'.repeat(elem.data('rank'));

    elem.find('.rank').html(rankPoint);
  };

  fn.reset = function() {
    __('#section-card .card').detach();
    SMBS.drawCard(true);
    evt.onReset();
  };

  var characterInBattle = [];
  // For Test
  __.each(character, function(code, data) {
    characterInBattle.push(data);
  });

  fn.drawCard = function(fill) {
    var count = __('#section-card .card').length,
      randomCard = 'ABCDEFGH';
    if (count < 8) {
      count = 8 - count;
      (function draw() {
        count--;
        var randCharacter = characterInBattle[Math.floor(Math.random() * (characterInBattle.length - 1))],
          cardID = 'card_' + randCharacter.code + '_skill_' + Math.ceil(Math.random() * 2) + '_' + randCharacter.id;

        var randID = randomCard.charAt(Math.floor(Math.random() * Math.floor(randomCard.length - 1))),
          card = __('<div class="card" data-id="' + cardID + '" data-rank="1"><div class="rank">★</div></div>');

        card.css({
          'background-image': "url(./images/" + cardID + ".png)"
        });

        __('#section-card').prepend(card);
        SMBS.setupCard(card);
        card.css({
          'animation-name': 'card-in',
          'animation-duration': '.1s',
          'animation-fill-mode': 'forwards'
        }).once('animationend', function() {
          card.removeCss('animation-name');
          if (count > 0) {
            draw();
          } else {
            fn.mergeCard(__('#section-card .card:first-child'), fill);
          }
        });
      })();
    } else {
      locked = false;
    }
  };

  fn.getRandomCard = function(filter) {
    var cards = __('#section-card .card'),
      index;

    if (__.isCallable(filter)) {
      cards.filter(filter);
    }

    if (cards.length > 0) {
      index = Math.floor(Math.random() * cards.length);
      return cards.get(index);
    }
    return __();
  };

  fn.event = evt;

  contaxt.SMBS = fn;
})(window);

var locked = false;
__(function() {
  __('#reset').click(() => SMBS.reset())
  __('#draw').click(() => {
    if (!locked) {
      locked = true;
      SMBS.drawCard(true)
    }
  })
  locked = true;
  SMBS.drawCard(true);

  // Extra Function: Reserve Slot
  __('#enable-reserve-slot').change(function() {
    var elem = __(this),
      checked = elem.checked();

    if (!checked) {
      __('#reserve-slot').detach();
    } else {
      var reserveSlot = __('<div id="reserve-slot"></div>');
      reserveSlot.dropable({
        drop: function(e) {
          var elem = __(this);
          if (SMBS.event.onReverseDropable(e.draggedItem)) {
            elem.html('');
            elem.append(e.draggedItem)
          }
        }
      })
      __('#battle-ui').append(reserveSlot)
    }
  });

  // Extra Function: Freeze Card
  __('#freeze-card').click(() => {
    SMBS.getRandomCard(function() {
      return !__(this).hasClass('freeze')
    }).addClass('freeze');
  });

  // Extra Function: Curse Card
  __('#curse-card').click(() => {
    var elem = SMBS.getRandomCard(),
      cursed = parseInt(elem.data('cursed')) || 0,
      rank = parseInt(elem.data('rank')) || 0;

    if (cursed < 2 && rank + cursed < 3) {
      if (!elem.hasClass('cursed')) {
        elem.addClass('cursed');
      }

      cursed++;
      elem.data('cursed', cursed);
      SMBS.drawRank(elem);
    }
  });
})
