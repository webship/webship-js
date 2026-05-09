
# When I attach the file "file name" to "element"

## Gherkin Step Phrasing

```
When (I|we)* attach the file "([^"]*)?" to "([^"]*)?"
```

## Description

This step definition enables test automation for file uploads by attaching files to file input elements. The step allows subsequent actions to be performed on the uploaded files.

## Setup Requirements

Test files must be organized in the `tests/assets` directory. Files should be placed there in advance with appropriate naming. During feature execution, files are referenced by name and loaded into the file input element identified by the specified selector.

For proper configuration of the `tests/assets` folder path, reference the Global Settings documentation.

## Usage

Create a step that attaches a file to a field using its id, class, name, or label identifier.

## Example

```
When I attach the file "profileIcon.jpg" to "#profileIconUpload"
```

## Parameters

- **file name**: The name of the file located in `tests/assets`
- **element**: The target field identifier (id, class, name, or label)

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I attach the file "resume.pdf" to "#resume"
   And I press "Upload"
```

### Example 2

```gherkin
When I attach the file "logo.svg" to "input[name=logo]"
```

### Example 3

```gherkin
When we attach file "report.csv" to "[data-testid=csv-upload]"
```

### Example 4

```gherkin
When I attach file "video.mp4" to "#video-input"
   And I wait for AJAX to finish
```

### Example 5

```gherkin
When I attach the file "profile.jpg" to "#avatar-upload"
   Then I should see "Avatar uploaded"
```

