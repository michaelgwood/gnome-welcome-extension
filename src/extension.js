const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const MessageTray = imports.ui.messageTray;
const Mainloop = imports.mainloop;
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Bubble = Me.imports.bubble;

const Gettext = imports.gettext.domain ('welcometognome');

let WPS = 0.5
let textTimeout = 0;

const Area = {
    OVERVIEW: 0,
    APPLICATIONS: 1,
    CALENDAR: 2,
    EXTENSIONS: 3,
    NOTIFICATIONS: 4
};

function _do_notification ()
{
    /* We've still got a libnotification active */
    if (this._source.notifications.length > 0)
      this._source.destroy ();

    let notification = new MessageTray.Notification (this._source,
                                                     _("Notifications"),
                                                     _("Great"),
                                                     { customContent: false });
    /* notification must be dismissed */
    notification.urgency = MessageTray.Urgency.CRITICAL;

    this._source.notify (notification);

    notification.connect ("done-displaying", Lang.bind (this, function () {
        this.bubbles[Area.NOTIFICATIONS].emit ("done", null);
    }));
}


function next ()
{
    global.log ("next bubble please");

    for (let i=0; i<this.bubbles.length; i++)
      {
        let bubble = this.bubbles[i];

        if (bubble.done == false)
          {
            if (i == Area.NOTIFICATIONS)
              {
                Mainloop.timeout_add_seconds (3, Lang.bind (this, function ()
                                                      {
                                                        _do_notification ();
                                                      }));
                Main.messageTray.toggle ();
              }
            else if (i == Area.APPLICATIONS)
              {
                Main.overview.toggle ();
                Main.overview.connect ("shown", Lang.bind (this, function ()
                                                           {
                                                             bubble.open (0);
                                                             bubble.connect ("done", Lang.bind (this, function () { Main.overview.toggle (); }));
                                                           }));
                return;
              }
            bubble.open (0);
            return;
          }
      }

    /* everything done */
    global.log ("everything done");
}

function init ()
{
    this._button = new St.Bin({ style_class: 'panel-button',
                              reactive: true,
                              can_focus: true,
                              x_fill: true,
                              y_fill: false,
                              track_hover: true });

    this._icon = new St.Icon({ icon_name: 'media-playback-start-symbolic',
                               style_class: 'system-status-icon' });

    this._source = new MessageTray.Source (_("Welcome"),
                                           "gnome-stock-mail-new");
    Main.messageTray.add (this._source);

    this.bubbles = [];

    this.bubbles[Area.OVERVIEW] = new Bubble.TextBubble (_("Click Activities to go the overview."), Bubble.Direction.UP);
    this.bubbles[Area.OVERVIEW].targetActor = Main.panel.actor.get_child_at_index (0);

    this.bubbles[Area.APPLICATIONS] = new Bubble.TextBubble (_("Click on Applications to access all your installed and running applications"), Bubble.Direction.UP);
    this.bubbles[Area.APPLICATIONS].targetActor = Main.overview._dash.actor.get_child_at_index (0);

    this.bubbles[Area.CALENDAR] = new Bubble.TextBubble (_("Click on the date and time for a quick calendar view and access to the related settings"), Bubble.Direction.UP);
    this.bubbles[Area.CALENDAR].targetActor = Main.panel.actor.get_child_at_index (1);

    this.bubbles[Area.EXTENSIONS] = new Bubble.TextBubble (_("System extensions give you access to other system and account settings"), Bubble.Direction.UP);
    this.bubbles[Area.EXTENSIONS].targetActor = Main.panel.actor.get_child_at_index (2);

    this.bubbles[Area.NOTIFICATIONS] = new Bubble.TextBubble (_("This is your notification queue"), Bubble.Direction.DOWN);
    this.bubbles[Area.NOTIFICATIONS].targetActor = Main.layoutManager.trayBox;


    for (let i=0; i < this.bubbles.length; i++)
      {
        this.bubbles[i].connect ("done",
                                 Lang.bind (this, function () { next (); }));
      }

    this._button.set_child (this._icon);
    this._button.connect('button-press-event',
                         Lang.bind (this, function () { next (); }));

    Main.layoutManager.connect ('startup-complete',
                         Lang.bind (this, function () { next (); }));
}

function enable()
{
    Main.panel._rightBox.insert_child_at_index(this._button, 0);
}

function disable()
{
    Main.panel._rightBox.remove_child(this._button);
}
