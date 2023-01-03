const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const ast = require("./ast");

/**
 * 查找文件定义的provider，匹配到了就return一个location，否则不做处理
 * 最终效果是，当按住Ctrl键时（可以配置），如果return了一个location，字符串就会变成一个可以点击的链接，否则无任何效果
 * @param {*} document
 * @param {*} position  
 */
function provideDefinition(document, position) {
    const line = document.lineAt(position);
    const dvaDir = path.normalize(`${vscode.workspace.rootPath}/src/pages/.umi`);

    if (!fs.existsSync(dvaDir)) {
        return;
    }

    // 判断 xxxx type: “xxx/xxxx”的时候开始
    if (/.*(\'|\")?type(\'|\")?:.*\/.*(\'|\").*/.test(line.text)) {
        const action = line.text.split(',')[0].match(/(\'|\")?type(\'|\")?:.*\/.*(\'|\")/);
        const actionType = action ? action[0].replace(/.*type.*:\s*[\'\"]/, '').replace('"', '').replace("'", '') : null;
        // console.log("actionType:", actionType);

        const umiDva = fs.readFileSync(`${dvaDir}/dva.js`, 'utf-8');
        let modelUrlArr = umiDva.match(/app\.model\(.*\)/g);
        modelUrlArr = modelUrlArr.map(item => {
            const ret = item.replace(/(app\.model\()|(\)\.default\))|(\)$)/g, '')
                .replace(/\.\.\.\(require\(/g, '"url":').replace(/\'/g, '"').replace('namespace', '"namespace"');
            const result = JSON.parse(ret);
            try {
                const astData = ast(fs.readFileSync(result.url, 'utf-8'));
                if (astData && astData.type === 'File') {
                    const { body } = astData.program;
                    const exportNode = body.find(item => item.type === 'ExportDefaultDeclaration');
                    if (exportNode) {
                        const finalNamespace = exportNode.declaration.properties.find(item => (item.key.name === 'namespace'));
                        if (finalNamespace) {
                            result.namespace = finalNamespace.value.value;
                        }
                    }
                }   
            } catch (error) {
                console.log(error);
            }
            return result;
        });

        const actionArr = actionType.split('/');
        // @ts-ignore
        const prviderObj = modelUrlArr.find(i => i.namespace === actionArr[0]);
        // @ts-ignore
        if (prviderObj && fs.existsSync(prviderObj.url)) {
            let positionline = 1;
            let positioncol = 1;
            try {
                // @ts-ignore
                const ret = fs.readFileSync(prviderObj.url, 'utf-8')
                const data = ast(ret);
                if (data && data.type === 'File') {
                    const { body } = data.program;
                    const exportNode = body.find(item => item.type === 'ExportDefaultDeclaration');
                    if (exportNode) {
                        const effectAndReduceNode = exportNode.declaration.properties
                            .filter(item => (item.key.name === 'effects' || item.key.name === 'reducers'));
                        effectAndReduceNode.forEach(element => {
                            if (element) {
                                const { properties = [] } = element.value;
                                const effectObj = properties.find(prop => prop.key.name === actionArr[1]);
                                if (effectObj) {
                                    positionline = effectObj.loc.start.line - 1;
                                    positioncol = effectObj.loc.start.column;
                                }
                            } 
                        });
                    }
                }
            } catch (error) {
                console.log(error);
            }

            const position = new vscode.Position(positionline, positioncol);

            // @ts-ignore
            return new vscode.Location(vscode.Uri.file(prviderObj.url), position);
        }
    }
}

module.exports = function(context) {
    // 注册如何实现跳转到定义，第一个参数表示仅对'javascriptreact','typescriptreact', 'typescript', 'javascript'文件生效
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(['javascriptreact','typescriptreact', 'typescript', 'javascript'], {
        provideDefinition
    }));
};