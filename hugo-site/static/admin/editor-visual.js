
(function () {
  const h = window.h;
  const createClass = window.createClass;

  if (!window.CMS || !h || !createClass) {
    console.error("Decap CMS ou suas funções ainda não foram carregados.");
    return;
  }

  const tipos = [
    { value: "texto", label: "Texto" },
    { value: "imagem", label: "Imagem" },
    { value: "video", label: "Vídeo do YouTube" },
    { value: "link", label: "Hiperlink" }
  ];

  const vazio = {
    type: "texto",
    text: "",
    url: "",
    caption: ""
  };

  function copiar(bloco) {
    return Object.assign({}, bloco);
  }

  function enderecoVideo(url) {
    if (!url) return "";
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    return match ? match[1] : "";
  }

  const EditorVisual = createClass({
    getInitialState: function () {
      return {
        blocks: Array.isArray(this.props.value)
          ? this.props.value.map(copiar)
          : [],
        draft: Object.assign({}, vazio),
        editing: -1,
        dragging: -1
      };
    },

    componentDidUpdate: function (prevProps) {
      if (prevProps.value !== this.props.value &&
          this.props.value !== this.state.blocks) {
        this.setState({
          blocks: Array.isArray(this.props.value)
            ? this.props.value.map(copiar)
            : []
        });
      }
    },

    atualizar: function (blocks) {
      this.setState({ blocks: blocks });
      this.props.onChange(blocks);
    },

    alterarRascunho: function (campo, valor) {
      const draft = Object.assign({}, this.state.draft);
      draft[campo] = valor;
      this.setState({ draft: draft });
    },

    adicionar: function () {
      const draft = copiar(this.state.draft);
      if (draft.type === "texto" && !draft.text.trim()) return;
      if (draft.type === "imagem" && !draft.url.trim()) return;
      if (draft.type === "video" && !enderecoVideo(draft.url)) return;
      if (draft.type === "link" && !draft.url.trim()) return;

      const blocks = this.state.blocks.slice();
      if (this.state.editing >= 0) {
        blocks[this.state.editing] = draft;
      } else {
        blocks.push(draft);
      }

      this.atualizar(blocks);
      this.setState({
        draft: Object.assign({}, vazio),
        editing: -1
      });
    },

    editar: function (index) {
      this.setState({
        draft: copiar(this.state.blocks[index]),
        editing: index
      });
    },

    duplicar: function (index) {
      const blocks = this.state.blocks.slice();
      blocks.splice(index + 1, 0, copiar(blocks[index]));
      this.atualizar(blocks);
    },

    excluir: function (index) {
      const blocks = this.state.blocks.slice();
      blocks.splice(index, 1);
      this.atualizar(blocks);
      if (this.state.editing === index) {
        this.setState({
          draft: Object.assign({}, vazio),
          editing: -1
        });
      }
    },

    mover: function (origem, destino) {
      if (origem < 0 || destino < 0 || origem === destino) return;
      const blocks = this.state.blocks.slice();
      const item = blocks.splice(origem, 1)[0];
      blocks.splice(destino, 0, item);
      this.atualizar(blocks);
      this.setState({ dragging: -1 });
    },

    renderCampo: function () {
      const d = this.state.draft;
      const campo = (label, name, placeholder, multiline) =>
        h("label", { className: "ev-field" },
          h("span", null, label),
          multiline
            ? h("textarea", {
                value: d[name] || "",
                placeholder: placeholder,
                rows: 5,
                onChange: e => this.alterarRascunho(name, e.target.value)
              })
            : h("input", {
                type: "text",
                value: d[name] || "",
                placeholder: placeholder,
                onChange: e => this.alterarRascunho(name, e.target.value)
              })
        );

      if (d.type === "texto") {
        return campo("Conteúdo", "text", "Escreva o texto...", true);
      }
      if (d.type === "imagem") {
        return h("div", null,
          campo("Caminho da imagem", "url", "/images/uploads/imagem.jpg"),
          campo("Legenda (opcional)", "caption", "Legenda da imagem")
        );
      }
      if (d.type === "video") {
        return h("div", null,
          campo("Endereço do vídeo", "url", "https://www.youtube.com/watch?v=..."),
          campo("Legenda (opcional)", "caption", "Legenda do vídeo")
        );
      }
      return h("div", null,
        campo("Texto do link", "text", "Acesse o projeto"),
        campo("Endereço do link", "url", "https://...")
      );
    },

    renderBloco: function (bloco, index) {
      let conteudo;

      if (bloco.type === "texto") {
        conteudo = h("p", null, bloco.text);
      } else if (bloco.type === "imagem") {
        conteudo = h("div", null,
          h("div", { className: "ev-placeholder" },
            "Imagem: " + (bloco.url || "sem arquivo")
          ),
          bloco.caption ? h("small", null, bloco.caption) : null
        );
      } else if (bloco.type === "video") {
        const id = enderecoVideo(bloco.url);
        conteudo = id
          ? h("div", { className: "ev-video" },
              h("a", {
                href: "https://www.youtube.com/watch?v=" + id,
                target: "_blank",
                rel: "noopener noreferrer"
              }, "▶  Prévia do vídeo do YouTube")
            )
          : h("p", null, "Endereço de vídeo inválido.");
      } else {
        conteudo = h("a", {
          href: bloco.url,
          target: "_blank",
          rel: "noopener noreferrer"
        }, bloco.text || bloco.url);
      }

      return h("div", {
        className: "ev-block",
        key: index,
        draggable: true,
        onDragStart: () => this.setState({ dragging: index }),
        onDragOver: e => e.preventDefault(),
        onDrop: () => this.mover(this.state.dragging, index)
      },
        h("div", { className: "ev-block-head" },
          h("strong", null,
            (index + 1) + ". " +
            (tipos.find(t => t.value === bloco.type)?.label || "Elemento")
          ),
          h("div", { className: "ev-actions" },
            h("button", { type: "button", onClick: () => this.editar(index) }, "Editar"),
            h("button", { type: "button", onClick: () => this.duplicar(index) }, "Duplicar"),
            h("button", { type: "button", onClick: () => this.excluir(index) }, "Excluir")
          )
        ),
        h("div", { className: "ev-block-content" }, conteudo)
      );
    },

    render: function () {
      return h("div", { className: "ev-editor" },
        h("style", null, `
          .ev-editor { font-family: Arial,sans-serif; color:#263238; }
          .ev-columns { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
          .ev-panel { border:1px solid #ccd4da; border-radius:7px; padding:16px; min-width:0; }
          .ev-panel h3 { margin:0 0 14px; font-size:17px; }
          .ev-field { display:block; margin:12px 0; }
          .ev-field span { display:block; font-weight:bold; margin-bottom:5px; }
          .ev-field input,.ev-field textarea,.ev-type {
            box-sizing:border-box; width:100%; padding:9px;
            border:1px solid #aebbc4; border-radius:4px; font:inherit;
          }
          .ev-field textarea { resize:vertical; }
          .ev-primary,.ev-actions button {
            padding:7px 10px; border:1px solid #aebbc4;
            border-radius:4px; cursor:pointer; background:#f4f6f8;
          }
          .ev-primary { background:#087dcc; color:white; border-color:#087dcc; }
          .ev-block { border:1px solid #cbd4db; border-radius:6px; margin:12px 0; background:white; }
          .ev-block-head { display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; padding:9px; background:#f1f4f6; }
          .ev-actions { display:flex; flex-wrap:wrap; gap:5px; }
          .ev-block-content { padding:12px; overflow-wrap:anywhere; }
          .ev-placeholder,.ev-video { padding:25px 10px; background:#edf2f5; text-align:center; }
          .ev-video a { font-weight:bold; text-decoration:none; }
          .ev-empty { color:#687780; padding:20px 5px; text-align:center; }
          @media(max-width:700px) { .ev-columns { grid-template-columns:1fr; } }
        `),
        h("div", { className: "ev-columns" },
          h("section", { className: "ev-panel" },
            h("h3", null, "Adicionar elemento"),
            h("label", { className: "ev-field" },
              h("span", null, "Tipo de elemento"),
              h("select", {
                className: "ev-type",
                value: this.state.draft.type,
                onChange: e => this.alterarRascunho("type", e.target.value)
              }, tipos.map(t => h("option", { key:t.value, value:t.value }, t.label))
              )
            ),
            this.renderCampo(),
            h("button", {
              type: "button",
              className: "ev-primary",
              onClick: this.adicionar
            }, this.state.editing >= 0 ? "Atualizar elemento" : "Adicionar à publicação"),
            this.state.editing >= 0
              ? h("button", {
                  type: "button",
                  onClick: () => this.setState({
                    draft: Object.assign({}, vazio),
                    editing: -1
                  })
                }, "Cancelar edição")
              : null
          ),
          h("section", { className: "ev-panel" },
            h("h3", null, "Prévia da publicação"),
            this.state.blocks.length
              ? this.state.blocks.map((b,i) => this.renderBloco(b,i))
              : h("div", { className: "ev-empty" },
                  "Os elementos adicionados aparecerão aqui, na ordem escolhida."
                )
          )
        )
      );
    }
  });

  const PreviewVisual = createClass({
    render: function () {
      const blocks = Array.isArray(this.props.value) ? this.props.value : [];
      return h("div", null,
        blocks.map((b, i) => h("div", { key:i },
          b.type === "texto" ? h("p", null, b.text) :
          b.type === "link" ? h("p", null, h("a", { href:b.url }, b.text || b.url)) :
          b.type === "imagem" ? h("p", null, "Imagem: " + b.url) :
          h("p", null, "Vídeo: " + b.url)
        ))
      );
    }
  });

  window.CMS.registerWidget(
    "editor_visual",
    EditorVisual,
    PreviewVisual
  );
})();
