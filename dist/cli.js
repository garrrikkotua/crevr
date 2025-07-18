#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';
import { RevertServer } from './server.js';
const program = new Command();
program
    .name('claude-revert')
    .description('A CLI tool with UI for reverting Claude Code changes')
    .version('1.0.0');
program
    .command('start')
    .description('Start the UI server')
    .option('-p, --port <port>', 'port to run the server on', '3456')
    .option('--no-open', 'don\'t automatically open the browser')
    .action(async (options) => {
    const port = parseInt(options.port);
    const server = new RevertServer(port);
    try {
        await server.start();
        if (options.open) {
            console.log(chalk.green('Opening browser...'));
            await open(`http://localhost:${port}`);
        }
        console.log(chalk.blue(`UI available at: http://localhost:${port}`));
        console.log(chalk.gray('Press Ctrl+C to stop'));
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\\nShutting down server...'));
            server.stop();
            process.exit(0);
        });
    }
    catch (error) {
        console.error(chalk.red('Failed to start server:'), error);
        process.exit(1);
    }
});
program
    .command('list')
    .description('List recent changes without starting the UI')
    .action(async () => {
    const { ClaudeLogParser } = await import('./parser.js');
    const { ChangeTracker } = await import('./change-tracker.js');
    try {
        const parser = new ClaudeLogParser();
        const tracker = new ChangeTracker();
        const fileChanges = await parser.getFileChanges();
        const changes = await tracker.processChanges(fileChanges);
        if (changes.length === 0) {
            console.log(chalk.gray('No changes found'));
            return;
        }
        console.log(chalk.bold('\\nRecent Claude Code changes:\\n'));
        changes
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10)
            .forEach((change, index) => {
            const time = new Date(change.timestamp).toLocaleString();
            const typeColor = {
                create: chalk.green,
                edit: chalk.yellow,
                write: chalk.blue,
                delete: chalk.red
            }[change.type];
            console.log(`${index + 1}. ${typeColor(change.type.toUpperCase())} ${change.filePath}`);
            console.log(`   ${chalk.gray(time)}`);
            console.log();
        });
    }
    catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map