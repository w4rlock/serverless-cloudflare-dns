const record = {
  usage: 'Cloud Flare Record ABM',
  commands: {
    deploy: {
      usage: 'Create new record set',
      lifecycleEvents: ['deploy'],
    },
    remove: {
      usage: 'Remove new record set',
      lifecycleEvents: ['remove'],
    },
    update: {
      usage: 'Update new record set',
      lifecycleEvents: ['update'],
    },
    list: {
      usage: 'List record set',
      lifecycleEvents: ['list'],
      options: {
        all: {
          usage: 'List all records',
          shortcut: 'A',
          required: false,
        },
      },
    },
  },
};

module.exports = {
  cloudflare: {
    usage: 'Cloud Flare',
    commands: {
      record,
    },
  },
};
