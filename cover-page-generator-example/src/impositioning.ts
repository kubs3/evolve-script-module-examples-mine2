import type { Commands, Group, MetaContext, Metadata, PageSizes } from "./types";
import * as parameters from "./parameters"; 

const INSPIRE_NATIVE = "InspireNative";
export const IMPOSITIONING_CATEGORY = "Impositioning";

export function loadPageSizeObj(metadataJson: Metadata): PageSizes {
    let pageCount = 0;
    let sizes: Array<any> = [];
    for (let index = 0; index < metadataJson.pageSizes.length; index = index + 2) {
        const count = metadataJson.pageSizes[index];
        if (Array.isArray(count)) {
            throw new Error("Could not read metadata.");
            continue;
        }
        const size = metadataJson.pageSizes[index + 1];
        if (!Array.isArray(size)) {
            throw new Error("Could not read metadata.");
            continue;
        }
        for (let pageIndex = pageCount; pageIndex < pageCount + count; pageIndex++) {
            sizes.push(size);
        }
        pageCount = pageCount + count;
    }
    return {
        pageCount: pageCount,
        sizes: sizes,
    };
}

export function getCommandFilePath(): string {
    return "job://output/command-" + createGuid() + ".json";
}

export async function writeCommandFile(commandJson: Commands, commandFilePath: string, context: Context) {
    let commandFile = context.getFile(parameters.pathToWorkingDir(commandFilePath));
    await commandFile.write(JSON.stringify(commandJson));
}

export function createMetaContext(metadataJson: Metadata): MetaContext {
    const pageSizes = loadPageSizeObj(metadataJson);
    const metaContext: MetaContext = {
        totalPages: pageSizes.pageCount,
        groups: [],
    };
    let totalPageCounter = 0;
    for (let i = 0; i < metadataJson.groups.length; i++) {
        const group = metadataJson.groups[i];
        const pageCount = metadataJson.groupSizes[i];

        const groupInfo: Group = {
            group,
            pageCount,
            pageSizes: [],
            pageNumbers: [],
        };

        for (let i = totalPageCounter; i < totalPageCounter + pageCount; i++) {
            groupInfo.pageSizes.push(pageSizes.sizes[i]);
            groupInfo.pageNumbers.push(i + 1);
        }
        metaContext.groups.push(groupInfo);

        totalPageCounter = totalPageCounter + pageCount;
    }

    return metaContext;
}

export function getTranformationIdentityMatrix(): number[] {
    return [1, 0, 0, 1, 0, 0];
}

export function tranformationAddScale(scale: number, transformation: number[]): number[] {
    transformation[0] = scale;
    transformation[3] = scale;
    return transformation;
}

export function transformationAddMove(moveX: number, moveY: number, transformation: number[]): number[] {
    transformation[4] += moveX;
    transformation[5] += moveY;
    return transformation;
}

export function transformationRotate(degrees: number, transformation: number[]): number[] {
    const angleRad = degrees_to_radians(degrees);
    const inputMatrix = [
        [transformation[0], transformation[2], 0],
        [transformation[1], transformation[3], 0],
        [0, 0, 1],
    ];

    const angleMatrix = [
        [Math.cos(angleRad), -Math.sin(angleRad), 0],
        [Math.sin(angleRad), Math.cos(angleRad), 0],
        [0, 0, 1],
    ];
    const result = multiplyMatrices(angleMatrix, inputMatrix);
    return [result[0][0], result[1][0], result[0][1], result[1][1], transformation[4], transformation[5]];
}

export function transformationRotate180(transformation: number[]): number[] {
    const inputMatrix = [
        [transformation[0], transformation[2], 0],
        [transformation[1], transformation[3], 0],
        [0, 0, 1],
    ];
    const angleMatrix = [
        [-1, 0, 0],
        [0, -1, 0],
        [0, 0, 1],
    ];
    const result = multiplyMatrices(angleMatrix, inputMatrix);
    return [result[0][0], result[1][0], result[0][1], result[1][1], transformation[4], transformation[5]];
}

export async function createBundledGenerateOutput(
    commandFilePath: string,
    context: Context,
    outputFilePath: string | null = null,
): Promise<BundledGenerateOutputV2> {
    let outputFile;
    const outputType = context.parameters.outputType as BundledGenerateOutputType;
    const productionConfigurationType = context.parameters.productionConfigurationType as string;
    const productionConfiguration = context.parameters.productionConfiguration as string;

    if (outputFilePath === null) {
        outputFile = await getOutputFilePath(context);
    } else {
        outputFile = outputFilePath;
    }
    return await createBundledGenerateOutputNoInputs(
        commandFilePath,
        context,
        outputFile,
        outputType,
        productionConfigurationType,
        productionConfiguration,
    );
}

export async function createBundledGenerateOutputNoInputs(
    commandFilePath: string,
    context: Context,
    outputFilePath: string,
    outputType: BundledGenerateOutputType,
    productionConfigurationType: string,
    productionConfigurationPath: string,
): Promise<BundledGenerateOutputV2> {
    const isInspireNativeOutput = outputType === INSPIRE_NATIVE;
    const bundledGenerate: BundledGenerateOutputV2 = {
        channel: "Print",
        template: context.environment.impositioningTemplatePath,
        outputType: outputType,
        outputPath: ipsPathNormalizer(outputFilePath, context),
        inputPaths: [
            {
                name: "Commands",
                path: commandFilePath,
            },
        ],
        
    };

    if (isInspireNativeOutput) {
        bundledGenerate.metadataPath = ipsPathNormalizer(outputFilePath + ".json", context);
    }

    const productionConfiguration = ipsPathNormalizer(mapToAbsolutePath(productionConfigurationType, productionConfigurationPath), context);
    if (parameters.isStringValid(productionConfiguration)) {
        bundledGenerate.productionConfiguration = productionConfiguration;
    }
    return bundledGenerate;
}

export async function getOutputFilePath(context: Context): Promise<string> {
    const param = context.parameters.outputFilePath;
    if (parameters.isStringValid(param)) {
        return parameters.pathToWorkingDir(param);
    }
    const inputFilePath = await parameters.getInputFilePath(context);
    return inputFilePath.substr(0, inputFilePath.lastIndexOf(".")) + ".%e";
}

function mapToAbsolutePath(type: string, path: string): string {
    if (parameters.isStringValid(type) && parameters.isStringValid(path)) {
        switch (type) {
            case "WorkingFolder":
                return "job://" + path;
            case "Share":
                return "share://" + path;
            case "Icm":
                return "icm://" + path;
            case "Custom":
                return path;
            case "IcmSampleSolutions":
                return "icm://Sample Solutions/" + path;
            case "IcmCustomSolutions":
                return "icm://Custom Solutions/" + path;
            case "IcmContentAuthor":
                return "icm:S:Production:S:UserResource//Interactive/StandardPackage/Templates/" + path;
            default:
                return path;
        }
    } else {
        return "";
    }
}

function degrees_to_radians(degrees: number): number {
    const pi = Math.PI;
    return degrees * (pi / 180);
}

function multiplyMatrices(m1: number[][], m2: number[][]): number[][] {
    let result: number[][] = [];
    for (var i = 0; i < m1.length; i++) {
        result[i] = [];
        for (var j = 0; j < m2[0].length; j++) {
            let sum = 0;
            for (var k = 0; k < m1[0].length; k++) {
                sum += m1[i][k] * m2[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

export function ipsPathNormalizer(path: string, context: Context): string {
    const blob = "blob://";
    if (path.trim().toLowerCase().indexOf(blob) === 0) {
        return (
            "share2://" +
            context.environment.productionType.toLowerCase() +
            "/" +
            context.environment.jobId +
            "/blob/" +
            path.trim().substring(blob.length)
        );
    }
    return path;
}

export async function validateMetadataFileExists(metadataFile: IFile) {
    if (!(await metadataFile.exists())) {
        throw new Error(
            "The metadata file was not found. Make sure that the file exists. If you did not specify the metadata file's path via input parameters, make sure that the JSON file is placed in the same directory as the corresponding TNO file.",
        );
    }
}
