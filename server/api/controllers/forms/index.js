module.exports = {
  async fn() {
    const forms = await Form.find();

    return {
      items: forms,
    };
  },
};
