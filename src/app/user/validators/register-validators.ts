import { ValidationErrors, AbstractControl, ValidatorFn } from "@angular/forms";

export class RegisterValidators {

    // THIS FUNCTION VALIDATES IF TWO FIELDS MATCH

    static match(controlName: string, matchingControlName: string) : ValidatorFn {
        return (group : AbstractControl) : ValidationErrors | null => {
            const control = group.get(controlName);
            const matchingControl = group.get(matchingControlName);

            if (!control || !matchingControl) { // IF THEY'RE EMPTY
                console.error('Form controls cannot be found in the form group');
                return {controlNotFound : false};
            }

            const error = control.value === matchingControl.value? null : {noMatch : true};
            
            matchingControl.setErrors(error);

            return error;
        }
    }
}
