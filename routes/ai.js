module.exports = {
  name: 'ai-routes',
  register: async function (server, options) {

    server.route({
      method: 'GET',
      path: '/ai/recommendations',
      handler: async (request, h) => {
        return h.response({ 
          message: 'AI Recommendations are not yet implemented.',
          tips: [
            "Track your expenses regularly.",
            "Set a budget for each category.",
            "Review your spending habits monthly."
          ]
        }).code(200);
      },
    });
  },
};