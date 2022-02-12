const conexao = require('../db/conexao');

module.exports = class EstacionamentoController {

  static async create(req, res) {

    const placa = req.body.placa;
    const id_patio = req.body.id_patio;
    const hora_entrada = req.body.hora_entrada;

    /*
      SELECT id FROM veiculos
      WHERE placa = 'AAA-0009'

    */
    const obterIdVeiculo = await conexao('veiculos')
      .where({ 'placa': placa })
      .first('id');

    const id_veiculo = obterIdVeiculo.id;

    const saidaNaoRegistrada = await conexao('estacionamento')
      .where({ 'id_veiculo': id_veiculo, 'hora_saida': null })
      .first();

    if (saidaNaoRegistrada) {
      return res.status(400).json({ error: 'Não é possível registrar nova entrada!' });
    }

    /*
      SELECT capacidade FROM patio
      WHERE id = 1

    */
    const obterCapacidade = await conexao('patio')
      .where({ 'id': id_patio })
      .first('capacidade');

    const capacidade = obterCapacidade.capacidade;

    if (capacidade > 0) {
      await conexao('estacionamento').insert({
        id_veiculo,
        id_patio,
        hora_entrada
      }).then(async (resultado) => {
        await conexao('patio')
          .where({ 'id': id_patio })
          .update({ capacidade: capacidade - 1 });
        return res.status(201).json(resultado);
      }).catch((err) => {
        console.log(err);
        return res.status(400).json({ error: 'Não foi possível cadastrar!' });
      });
    } else {
      return res.status(400).json({ error: 'Não há vagas disponiveis!' });
    }

  }

  static async list(req, res) {
    const resultado = await conexao.raw(`
      SELECT 
        e.id,
        placa,
        hora_entrada,
        hora_saida,
        TIMEDIFF(hora_saida, hora_entrada) AS permancia,
        CONCAT('R$ ',
          FORMAT(TIME_TO_SEC(TIMEDIFF(hora_saida, hora_entrada)) * 0.005,
                2, 'pt_BR')) AS valor
      FROM
        estacionamento e,
        veiculos v
      WHERE
        e.id_veiculo = v.id
        AND hora_saida IS NOT NULL
        AND data = CURRENT_DATE();
    `);

    return res.status(200).json(resultado[0]);

  }

  static async exibir_caixa(req, res) {
    const resultado = await conexao.raw(`
      SELECT 
	      CONCAT('R$ ',
	      FORMAT(sum(time_to_sec(timediff(hora_saida, hora_entrada))*0.005), 2, 'pt-BR')) AS caixa
      FROM estacionamento
      GROUP BY data
      HAVING data = curdate();
    `);
    return res.status(200).json(resultado[0]);
  }

  static async updateHoraSaida(req, res) {

    const placa = req.body.placa;
    const hora_saida = req.body.hora_saida;

    const obterIdVeiculo = await conexao('veiculos')
      .where({ 'placa': placa })
      .first('id');

    const id_veiculo = obterIdVeiculo.id;

    const obterIdPatio = await conexao('estacionamento')
      .where({ 'id_veiculo': id_veiculo, 'hora_saida': null })
      .first('id_patio');

    const id_patio = obterIdPatio.id_patio;

    const obterCapacidade = await conexao('patio')
      .where({ 'id': id_patio })
      .first('capacidade');

    const capacidade = obterCapacidade.capacidade;

    const resultado = await conexao('estacionamento')
      .where({ 'id_veiculo': id_veiculo, 'hora_saida': null })
      .update({ 'hora_saida': hora_saida });

    await conexao('patio')
      .where({ 'id': id_patio })
      .update({ capacidade: capacidade + 1 });

    return res.status(200).json(resultado);
  }

}