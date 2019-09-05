const inquirer = require('inquirer')
const { promisify } = require('util')
let download = require('download-git-repo') // 需要以callback的形式调用，不支持promise
download = promisify(download) // 对此进行包装，让其支持promise
const ora = require('ora') // 显示loading状态
const fs = require('fs')
const path = require('path')
const ncp = require('ncp') // nodecopy = ncp ??? 拷贝文件
const Metalsmith = require('metalsmith')
const consolidate = require('consolidate')
const { render } = consolidate.ejs
const chalk = require('chalk')

const fetchLoading = (fn, message, faillMsg) => {
  return async (...args) => {
    const spinner = ora(message)
    spinner.start()
    try {
      await fn(...args)
      spinner.succeed()
      return true
    } catch (error) {
      spinner.fail(faillMsg)
    }
  }
}

// 从github下载模板
const downloadTemplate = async (projectName, template) => {
  const githubUrl = 'littleyan-xu/' + template
  const dest = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template` // 存放的缓存目录

  const faillMsg = 'download template faill, please check the network'
  await fetchLoading(download, 'downling template', faillMsg)(githubUrl, dest)
  // console.log('结果：', result)

  // console.log('当前环境：',process.env.NODE_ENV = 'dev');
  // console.log('path:',path.resolve());
  // console.log('cwd:',process.cwd());

  return dest
}

const ask = (files, metal, done) => {
  return async (askFilePath) => {
    const answerResult = await inquirer.prompt(require(askFilePath))
    // console.log('询问的结果：', answerResult);

    // 将得到的结果值存入metalData供下一个插件使用
    let metadata = metal.metadata()
    Object.assign(metadata, answerResult)

    delete files['ask.js']

    done() // 调用回调函数，继续向下执行
  }
}

function template (files, metal, done) {
  const keys = Object.keys(files)
  keys.forEach(async (key) => {
    let content = files[key].contents.toString()
    // js或者json文件并且内容含有模板格式<%= %>说明才需要编译
    if (key.includes('.js') || key.includes('.json')) {
      const reg = /<%=[\w|\-|\s]*%>/
      if (reg.test(content)) {
        content = await render(content, metal.metadata()) // 替换模板内容
        files[key].contents = Buffer.from(content)
      }
    }
  })
}

// 选择模板
async function selectTemplate () {
  let templateList = ['vue-template', 'simple-template']
  let qestion = {
    name: 'template', // 生成答案所对应的属性名称
    type: 'list', // 类型为选择列表
    message: 'please choice a template to create project', // 用户选择的提示信息
    choices: templateList // 选择项
  }

  let answer = await inquirer.prompt(qestion)
  return answer.template
  // console.log('选择的模板是：',answer.template);
}

module.exports = async (projectName) => {
  const templateName = await selectTemplate()
  const tempPath = await downloadTemplate(projectName, templateName) // 存放缓存模板的目录
  const destPath = path.join(path.resolve(), projectName) // 当前输入命令的目录
  const askFilePath = path.join(tempPath, 'ask.js')

  // 如果存在ask.js说明需要ejs模板替换
  if (fs.existsSync(askFilePath)) {
    await new Promise((resolve, reject) => {
      Metalsmith(__dirname)
        .source(tempPath)
        .destination(destPath)
        .use(async (files, metal, done) => {
          await ask(files, metal, done)(askFilePath)
        })
        .use((files, metal, done) => {
          template(files, metal, done)
          console.log(chalk.green(`${projectName} project create successful!`))
          done()
        })
        .build((err) => {
          if (!err) {
            resolve()
          } else {
            reject(new Error('project create faill!'))
          }
        })
    })
  } else {
    // 不存在则直接将缓存目录的模板文档拷贝到当前执行命令的目录
    await ncp(tempPath, destPath)
  }
}

// 1)读取所有仓库得到需要选择的模板/ 直接设置选择数组[vue-template, simple-template]
// 2)安装交互式命令行工具inquirer
// 3)下载远程模板到本地 download-git-repo
// 4) 遍历下载的目录，找到ask.js文件，开启询问模式，拿到package.json所对应的信息
// 5)替换package.json所对应的信息
