module.exports = function registrarGuildMemberUpdate(client, contexto) {
  const {
    gruposHierarquia,
    gruposHierarquia2,
    montarEmbedHierarquia,
  } = contexto;

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
      const cargosMonitorados = [
        ...gruposHierarquia.flatMap((grupo) =>
          grupo.cargos.map((cargo) => cargo.id)
        ),
        ...gruposHierarquia2.flatMap((grupo) =>
          grupo.cargos.map((cargo) => cargo.id)
        ),
      ];

      const mudouCargo = cargosMonitorados.some((cargoId) => {
        const tinhaAntes = oldMember.roles.cache.has(cargoId);
        const temAgora = newMember.roles.cache.has(cargoId);

        return tinhaAntes !== temAgora;
      });

      if (!mudouCargo) return;

      await new Promise((resolve) => setTimeout(resolve, 1500));

      await newMember.guild.members.fetch({
        user: newMember.id,
        force: true,
      });

      await newMember.guild.members.fetch();

      if (process.env.HIERARQUIA_CHANNEL) {
        const canal = await client.channels.fetch(
          process.env.HIERARQUIA_CHANNEL
        );

        const mensagens = await canal.messages.fetch({
          limit: 30,
        });

        for (const grupo of gruposHierarquia) {
          const embed = montarEmbedHierarquia(
            newMember.guild,
            grupo
          );

          const msg = mensagens.find(
            (mensagem) =>
              mensagem.author.id === client.user.id &&
              mensagem.embeds[0]?.title === grupo.titulo
          );

          if (msg) {
            await msg.edit({
              embeds: [embed],
              allowedMentions: {
                parse: [],
              },
            });
          } else {
            await canal.send({
              embeds: [embed],
              allowedMentions: {
                parse: [],
              },
            });
          }
        }
      }

      if (process.env.HIERARQUIA2_CHANNEL) {
        const canal2 = await client.channels.fetch(
          process.env.HIERARQUIA2_CHANNEL
        );

        const mensagens2 = await canal2.messages.fetch({
          limit: 30,
        });

        for (const grupo of gruposHierarquia2) {
          const embed = montarEmbedHierarquia(
            newMember.guild,
            grupo
          );

          const msg2 = mensagens2.find(
            (mensagem) =>
              mensagem.author.id === client.user.id &&
              mensagem.embeds[0]?.title === grupo.titulo
          );

          if (msg2) {
            await msg2.edit({
              embeds: [embed],
              allowedMentions: {
                parse: [],
              },
            });
          } else {
            await canal2.send({
              embeds: [embed],
              allowedMentions: {
                parse: [],
              },
            });
          }
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar hierarquia:", error);
    }
  });
};