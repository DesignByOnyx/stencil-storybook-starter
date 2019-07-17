module.exports = (api) => {
    api.cache(true);

    return {
        presets: [
            [
                '@babel/env',
                {
                    targets: {
                        browsers: 'Last 2 Chrome versions, Firefox ESR',
                        node: '8.9',
                    },
                },
            ],
            '@babel/preset-typescript',
        ],
        plugins: [
            'dynamic-import-node'
        ],
        env: {
            build: {
                ignore: [
                    '**/*.test.tsx',
                    '**/*.test.ts',
                    '**/*.story.tsx',
                    '__snapshots__',
                    '__tests__',
                    '__stories__',
                ],
            },
        },
        ignore: ['node_modules'],
    };
};
