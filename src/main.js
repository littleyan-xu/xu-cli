
const program = require('commander')
const chalk = require('chalk')
const pkg = require('../package.json')
const path = require('path')

process.env.NODE_ENV = 'dev'

program
  .version(pkg.version)
  .usage('<command> [options]')

program
  .command('create <name>')
  .alias('c')
  .description('create a new project')
  .action((name) => {
    // console.log(name)
    const command = 'create'
    console.log('__dirname', __dirname)
    // console.log('参数：', ...process.argv.slice(3))
    require(path.resolve(__dirname, command))(name)
  })

program
  .command('config [value]')
  .description('inspect and modify the config')
  .option('-g, --get <path>', 'get value from option')
  .option('-s, --set <path> <value>', 'set option value')
  .action((value, cmd) => {
    console.log('配置选项参数：value:', value + '  cmd:' + cmd)
  })

// 输入未知命令时提示信息
program
  .arguments('<command>')
  .action((cmd) => {
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
    console.log()
  })

// 帮助提示加上e.g
program.on('--help', () => {
  console.log()
  console.log(chalk.yellow('Examples：'))
  console.log('xu-cli create my-project')
})

// 在未输入任何命令时，给出帮助提示
if (!process.argv.slice(2).length) {
  program.outputHelp()
}

program.parse(process.argv)
