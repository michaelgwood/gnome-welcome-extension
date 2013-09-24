
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Pango = imports.gi.Pango;
const St = imports.gi.St;
const Cairo = imports.cairo;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Mainloop = imports.mainloop;
const Signals = imports.signals;

const Direction = {
    UP: 0,
    DOWN: 1,
    RIGHT: 2,
    LEFT: 3
};

const TextBubble = new Lang.Class ({
    Name: 'TextBubble',
    Extends: St.Bin,

    _init: function (text, direction, params) {

        this.parent (params);

        this.targetActor = null;
        this.done = false;
        this.direction = direction;

        Main.uiGroup.add_actor (this);
        this.set_fill (true, true);
        this.hide ();
        this.set_style_class_name ("bubble");
        this.set_reactive (true);
        this.set_width (500);

        /* Target actor is the one we want to position ourselves by */

        this._label = new St.Label ();
        this._label.set_style_class_name ("bubble-text");
        this._label.set_text (text);
        let clutterText = this._label.get_clutter_text ();

        clutterText.set_reactive (true);
        clutterText.set_line_wrap (true);
        clutterText.set_font_name ("Shadows Into Light Two 30px");
        clutterText.set_ellipsize(Pango.EllipsizeMode.NONE);

        this._arrow = new St.Bin ();
        this._arrow.set_size (63, 69);
        this._arrow.set_pivot_point (0.5, 0.5);
        this._arrow.set_style_class_name ("bubble-arrow");

        this.closeButton = new St.Button ({style_class: "notification-close"});
        this.closeButton.connect ("clicked",
                                  Lang.bind (this, function () {
                                      this.close (0);
                                  }));
        this.connect ("key-press-event",
                      Lang.bind (this, function () { this.close (0); }));


        global.focus_manager.add_group (this);

        this.child = new St.Table ();

        this._updateDirection (Direction.UP);
    },

    set_text: function (text) {
        this._label.set_text (text);
    },

    open: function(timestamp) {
        this._positionToActor ();
        this.show ();
        this._pushModal ({ timestamp: timestamp });

        this.set_opacity (0);

        Tweener.addTween(this,
                         { opacity: 255,
                           time: 0.1,
                           transition: 'easeOutQuad'
                         });

        return true;
    },

    close: function(timestamp) {
        this._popModal(timestamp);
        this.done = true;

        Tweener.addTween(this,
                         { opacity: 0,
                           time: 0.1,
                           transition: 'easeOutQuad',
                           onComplete: Lang.bind(this,
                               function() {
                                   this.hide();
                                   this.emit ("done", null);
                               })
                         });
    },


    _updateDirection: function (direction) {

        /* Disregard previous layout */
        this.child.remove_all_children ();

        switch (direction) {
          case Direction.UP:
            this.child.add (this._label,
                            { x_fill : true,
                              y_fill : true,
                              y_expand: true,
                              x_expand: true,
                              x_align: St.Align.START,
                              y_align: St.Align.END,
                              row: 0,
                              col: 1
                            });
            this.child.add (this._arrow,
                            { x_fill : false,
                              y_fill : false,
                              y_expand: false,
                              x_expand: false,
                              x_align: St.Align.START,
                              y_align: St.Align.START,
                              row: 0,
                              col: 0
                            });
            this.x += 5.0;
            this.y += 5.0;

            break;

          case Direction.DOWN:
            this._arrow.set_rotation_angle (Clutter.RotateAxis.Z_AXIS, 180.0);
            this.child.add (this._label,
                            { x_fill : true,
                              y_fill : true,
                              y_expand: true,
                              x_expand: true,
                              x_align: St.Align.START,
                              y_align: St.Align.END,
                              row: 0,
                              col: 0
                            });
            this.child.add (this._arrow,
                            { x_fill : false,
                              y_fill : false,
                              y_expand: false,
                              x_expand: false,
                              x_align: St.Align.START,
                              y_align: St.Align.END,
                              row: 0,
                              col: 1
                            });

            this.x += 5.0;
            this.y -= 5.0;

            break;

          case Direction.LEFT:
            this.child.add (this._label,
                            { x_fill : true,
                              y_fill : true,
                              y_expand: true,
                              x_expand: true,
                              x_align: St.Align.START,
                              y_align: St.Align.START,
                              row: 0,
                              col: 0
                            });
            this.child.add (this._arrow,
                            { x_fill : false,
                              y_fill : false,
                              y_expand: false,
                              x_expand: false,
                              x_align: St.Align.START,
                              y_align: St.Align.END,
                              row: 0,
                              col: 1
                            });

            this.x += 5.0;
            this.y += 5.0;

            break;

          case Direction.RIGHT:
            this.child.add (this._label,
                            { x_fill : true,
                              y_fill : true,
                              y_expand: true,
                              x_expand: true,
                              x_align: St.Align.START,
                              y_align: St.Align.START,
                              row: 0,
                              col: 0
                            });
            this.child.add (this._arrow,
                            { x_fill : false,
                              y_fill : false,
                              y_expand: false,
                              x_expand: false,
                              x_align: St.Align.START,
                              y_align: St.Align.START,
                              row: 0,
                              col: 1
                            });

            this.x -= 5.0;
            this.y += 5.0;

            break;
        }


        this.child.add (this.closeButton,
                        { x_fill : false,
                          y_fill : false,
                          y_expand: false,
                          x_expand: false,
                          x_align: St.Align.END,
                          y_align: St.Align.START,
                          col: 3,
                          row: 0
                        });
    },

    _positionToActor: function () {
        let actor = this.targetActor;

        if (!actor)
          return;

        let stage = actor.get_stage ();
        let tryPosY = actor.get_y () +  actor.get_height ();
        let tryPosX = actor.get_x ();
        let direction = Direction.UP;

        let posY = 0;
        let posX = 0;

        /* Test the Y position are we going to go off bottom edge of stage? */
        if ((tryPosY + this.get_height ()) > stage.get_height ())
          {
            posY = actor.get_y () - this.get_height ();
            direction = Direction.DOWN;
          }
        else
          {
            posY = tryPosY;
            direction = Direction.UP;
          }

        /* Test the X position are we going outside the stage? */
        let xOverlapBy =  tryPosX + this.get_width () - stage.get_width ();
        if (xOverlapBy > 0)
          {
            posX = tryPosX - xOverlapBy;
            direction = Direction.RIGHT;
          }
        else
          {
            posX = tryPosX;
          }

        this.set_x (posX);
        this.set_y (posY);

        this._updateDirection (direction);
    },

    _popModal: function(timestamp) {

        Main.popModal(this, timestamp);
        global.gdk_screen.get_display().sync();
    },

    _pushModal: function (timestamp) {
        if (!Main.pushModal(this, { timestamp: timestamp }))
            return false;
        return true;
    }

});
Signals.addSignalMethods (TextBubble.prototype);
