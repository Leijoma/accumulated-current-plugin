const pluginConstructor = require('..');

describe('house current consumption', () => {
  test('consumedToday updates with house_current delta', () => {
    const handleMessages = [];
    const app = {
      debug: jest.fn(),
      error: jest.fn(),
      handleMessage: jest.fn((id, msg) => handleMessages.push(msg)),
      subscriptionmanager: {
        subscribe: jest.fn((sub, unsubscribes, onError, onDelta) => {
          app.deltaCb = onDelta;
        })
      }
    };

    const plugin = pluginConstructor(app);
    plugin.start({ house_current: 'houseCurrent', solar_current: 'solarCurrent' });

    const t0 = new Date('2024-01-01T00:00:00.000Z').toISOString();
    const t1 = new Date('2024-01-01T01:00:00.000Z').toISOString();

    // first update initializes lastTimeHouse
    app.deltaCb({
      updates: [
        { timestamp: t0, values: [{ path: 'houseCurrent', value: 5 }] }
      ]
    });

    // second update performs accumulation
    app.deltaCb({
      updates: [
        { timestamp: t1, values: [{ path: 'houseCurrent', value: 5 }] }
      ]
    });

    const lastMessage = handleMessages[handleMessages.length - 1];
    const consumed = lastMessage.updates[0].values.find(v => v.path === 'electrical.batteries.consumedToday').value;
    expect(consumed).toBeCloseTo(-5);
  });
});
