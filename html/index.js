function showOpenFilePickerPolyfill(options = {}) {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = options.multiple || false;
        if (options.types)
            input.accept = options.types
                .map((type) => type.accept)
                .flatMap((inst) => Object.keys(inst).flatMap((key) => inst[key]))
                .join(",");

        input.addEventListener("change", () => {
            resolve(
                [...input.files].map((file) => {
                    return {
                        getFile: async () =>
                            new Promise((resolve) => {
                                resolve(file);
                            }),
                    };
                })
            );
        });

        input.click();
    });
}

async function upload() {
    console.log("trying..")
    try {
        let files = await showOpenFilePickerPolyfill();
        /** @type {File} */
        let file = await files[0].getFile();
        if (!window.confirm(`${file.name} をアップロードしますか？`)) return;
        let formData = new FormData();
        formData.append("file", file);
        let params = new URLSearchParams({
            path: location.pathname
        });
        let res = await fetch("/api/upload?" + params, {
            method: "POST",
            body: formData
        });
        if (res.status == 200) {
            let json = await res.json();
            alert(`アップロードしました: ${json.fileName}`);
            return location.reload();
        }
        else if (res.status == 401)
            return alert("ログインに失敗しました");
        else
            return alert(`不明なエラー: ${res.status} ${res.statusText}`);
    } catch { console.error("Failed") }
}
(async function () {
    try {
        let files = await (await fetch("/api/files" + location.pathname)).json();
        let filesElem = document.getElementById("files");
        let path = location.pathname.slice(1).split("/").filter(x => !!x);
        if (path.length > 0) {
            let elem = document.createElement("li");
            elem.innerHTML = `<a href="/${path.slice(1).join("/")}">../</a>`;
            filesElem.appendChild(elem);
        }
        files.forEach(file => {
            let elem = document.createElement("li");
            elem.innerHTML = `<a href="${file.name}">${file.name}</a> (${file.directory ? "ディレクトリ" : file.sizeStr})`;
            filesElem.appendChild(elem);
        });
        document.getElementById("loading").remove();
    } catch (e) {
        console.error(e)
        document.getElementById("loading").innerText = "404 Not Found";
    }
})();