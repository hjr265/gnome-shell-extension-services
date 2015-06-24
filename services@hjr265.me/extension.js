const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;


let SERVICES = [
	{
		name: 'docker',
		label: 'Docker',
		probes: [
			{
				type: 'systemd',
				unit: 'docker.service'
			}
		]
	},
	{
		name: 'elasticsearch',
		label: 'Elasticsearch',
		probes: [
			{
				type: 'systemd',
				unit: 'elasticsearch.service'
			}
		]
	},
	{
		name: 'mongodb',
		label: 'MongoDB',
		probes: [
			{
				type: 'systemd',
				unit: 'mongodb.service'
			}
		]
	},
	{
		name: 'mysql',
		label: 'MySQL',
		probes: [
			{
				type: 'systemd',
				unit: 'mysqld.service'
			}
		]
	},
	{
		name: 'postgresql',
		label: 'PostgreSQL',
		probes: [
			{
				type: 'systemd',
				unit: 'postgresql.service'
			}
		]
	},
	{
		name: 'redis',
		label: 'Redis',
		probes: [
			{
				type: 'systemd',
				unit: 'redis.service'
			}
		]
	},
	{
		name: 'rethinkdb',
		label: 'RethinkDB',
		probes: [
			{
				type: 'systemd',
				unit: 'rethinkdb@default.service'
			}
		]
	},
	{
		name: 'smbd',
		label: 'Samba SMBD',
		probes: [
			{
				type: 'systemd',
				unit: 'smbd.service'
			}
		]
	},
	{
		name: 'nscd',
		label: 'Samba NSCD',
		probes: [
			{
				type: 'systemd',
				unit: 'nscd.service'
			}
		]
	},
	{
		name: 'ssh',
		label: 'SSH',
		probes: [
			{
				type: 'systemd',
				unit: 'sshd.service'
			}
		]
	},
];


function Services() {
	this.button = new PanelMenu.Button(0.0);
	var actor = new St.Icon({
		icon_name: 'system-run-symbolic',
		style_class: 'system-status-icon'
	});
	this.button.actor.add_actor(actor);
	this.button.actor.add_style_class_name('panel-status-button');

	this.button.actor.connect('button-press-event', Lang.bind(this, function() {
		this.refresh();
	}));
	this.refresh();

	Main.panel.addToStatusArea('services', this.button);
}
Services.prototype = {
	refresh: function() {
		this.button.menu.removeAll();
		SERVICES.forEach(Lang.bind(this, function(service) {
			let found = false;
			let active = false;
			let probe = service.probes.filter(function(probe) {
				if(found) {
					return false;
				}
				switch(probe.type) {
					case 'systemd':
						let [_, out] = GLib.spawn_command_line_sync('systemctl status --no-block ' + probe.unit);
						out = out.toString();
						if(out.match(/Loaded: loaded/g)) {
							found = true;
							if(out.match(/Active: (active|activating)/g)) {
								active = true;
							}
							return true;
						}
						break;
				}
			})[0];
			if(found) {
				let item = new PopupMenu.PopupSwitchMenuItem(service.label, active);
				this.button.menu.addMenuItem(item);
				item.connect('toggled', function() {
					switch(probe.type) {
						case 'systemd':
							GLib.spawn_command_line_async('sh -c "pkexec --user root systemctl ' + (active ? 'stop' : 'start') + ' ' + probe.unit + '; exit;"');
							break;
					}
				});
			}
		}));
	},

	destroy: function() {
		this.button.destroy();
	}
};


function init() {

}

var services;

function enable() {
	services = new Services();
}

function disable() {
	services.destroy();
}
