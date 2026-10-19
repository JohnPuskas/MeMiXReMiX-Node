
const SequelizeAuto = require('sequelize-auto');
const sequelize = require('./config/database');

async function generateModels() {
    try {
        const auto = new SequelizeAuto(sequelize, null, null, {
            directory: './src/models',
            schema: 'dbo',
            tables: [
                'AudioAssets',
                'SongLoops',
                'SongLoopAudioAssets'
            ],
            lang: 'es5',
            singularize: true,
            caseModel: 'p',
            caseFile: 'p',
            additional: {
                timestamps: false
            }
        });

        await auto.run();

        console.log('Sequelize models generated successfully.');
    } catch (err) {
        console.error('Model generation failed:', err);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

generateModels();
