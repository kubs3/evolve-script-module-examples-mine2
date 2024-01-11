import * as impositioning from "./impositioning";
import * as impositioningTtypes from "./types";
import * as commands from "./commands";
import * as parameters from "./parameters";

export function getDescription(): ScriptDescription {
    const descriptionInputParameters = [
        {
            id: "inputFilePath",
            displayName: "Input file path",
            description: "Path to TNO file containing source data.",
            type: "InputResource",
            required: true,
        },
        {
            id: "metadataFilePath",
            displayName: "Metadata file path",
            description:
                "Path to the metadata file. If left empty, the search for the file is performed in the same location as for the input file with the JSON extension, including the full name of the file (e.g. share://file.tno.json).",
            type: "InputResource",
            required: false,
        },
        {
            id: "prefixPagePath",
            displayName: "Prefix page path",
            description: "Path to extra page used as prefix(first page of the input).",
            type: "Connector",
            required: false,
        },
        {
            id: "sufixPagePath",
            displayName: "Sufix page path",
            description: "Path to extra page used as suffix(first page of the input)",
            type: "Connector",
            required: false,
        },
        {
            id: "outputFilePaths",
            displayName: "Output file path pattern",
            description: "Path to the output files. It should contain the %c substitution character, which represents the file index.",
            type: "String",
            required: true,
        },
        {
            id: "outputType",
            displayName: "Output type",
            description: "Desired output type.",
            type: "Selection",
            options: ["PDF", "AFP", "InspireNative", "MTIFF"],
            required: true,
            defaultValue: "InspireNative",
        },
        {
            id: "productionConfigurationType",
            displayName: "Production configuration prefix",
            description: "Prefix (type) locating the production configuration file.",
            type: "Selection",
            options: ["Icm", "IcmSampleSolutions", "IcmCustomSolutions", "Custom"],
            required: false,
            defaultValue: "Custom",
        },
        {
            id: "productionConfiguration",
            displayName: "Production configuration",
            description: "Path to production configuration file following the prefix (type).",
            type: "String",
            required: false,
        },
        { 
            id: "workingDirectory",
            displayName: "workingDirectory",
            description: "A working directory that stores auxiliary files generated during processing..",
            type: "Connector",
            required: true,
            readonly: true,
            defaultValue: "job://"
        },
    ] as InputParameterDescription[];

    return {
        displayName: "Cover Page Generator",
        description: "Takes a fixed document and adds it to the beginning or end of each document in a record",
        category: "Impositioning",
        input: descriptionInputParameters,
        output: [
            {
                id: "coverPageGenerator",
                type: "BundledGenerateArray",
                displayName: "Impositioning Bundle Generate Output",
                description: "Bundles the generate steps.",
            },
        ],
    };
}

export async function execute(context: Context): Promise<Output | void> {
    const inputFilePath = await parameters.getInputFilePath(context);
    const metadataFilePath = parameters.getMetadataFile(context, inputFilePath);
    const prefixPagePath: string | null = await parameters.getPrefixPagePath(context)
    const sufifPagePath: string | null = await parameters.getSufixPagePath(context) 

    
    const metadataFile = context.getFile(metadataFilePath);
    await impositioning.validateMetadataFileExists(metadataFile);
    const metadataJson = JSON.parse(await metadataFile.read());

    const metaContext = impositioning.createMetaContext(metadataJson);

    const outputFilesName = context.parameters.outputFilePaths as string;

    const results: BundledGenerateOutputV2[] = [];
    const commandJson = createCommandJson(metaContext, inputFilePath, prefixPagePath, sufifPagePath, context);
    const commandFilePath = impositioning.getCommandFilePath();
    await impositioning.writeCommandFile(commandJson, commandFilePath, context);
    results.push(await impositioning.createBundledGenerateOutput(commandFilePath, context, outputFilesName));

    return {
        coverPageGenerator: results,
    };
}

function createCommandJson(metaContext: impositioningTtypes.MetaContext, inputFileName: string, inputPrefixPage: string | null, inputSufixPage: string | null, context: Context): impositioningTtypes.Commands {
    const commandJson = {} as impositioningTtypes.Commands;
    commandJson.pages = [];

    metaContext.groups.forEach((group) => {
        for (let i = 0; i < group.pageSizes.length; i++) {
            let newPage: impositioningTtypes.Command[] = [];

            if (i === 0 && inputPrefixPage === null) {
            newPage.push(commands.createGroupBeginCommmand());
            newPage.push(commands.createPageSizeCommmand(group.pageSizes[i]));
            }

            if(i === 0 && inputPrefixPage != null)
            {
                let prefixPage: impositioningTtypes.Command[] = [];
                prefixPage.push(commands.createGroupBeginCommmand());
                prefixPage.push(commands.createCopyInputPageCommand(context, inputPrefixPage, 1));
                prefixPage.push(commands.createPageSizeCommmand(group.pageSizes[i]));
    
                commandJson.pages.push(prefixPage);
            }
            newPage.push(commands.createCopyInputPageCommand(context, inputFileName, group.pageNumbers[i]));
            newPage.push(commands.createPageSizeCommmand(group.pageSizes[i]));

            commandJson.pages.push(newPage);
            
            if(i === group.pageSizes.length - 1  && inputSufixPage != null)
            {
                let sufixPage: impositioningTtypes.Command[] = [];
                sufixPage.push(commands.createCopyInputPageCommand(context, inputSufixPage, 1));
                sufixPage.push(commands.createPageSizeCommmand(group.pageSizes[i]));
                commandJson.pages.push(sufixPage);
            }
        }
    });
    return commandJson;
}
