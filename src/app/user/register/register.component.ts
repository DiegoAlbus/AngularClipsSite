import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  name = new FormControl('', [
    Validators.required, // undefined, null or empty
    Validators.minLength(3)
  ]);
  email = new FormControl('',[
    Validators.required,
    Validators.email
  ]);
  age = new FormControl('',[
    Validators.required,
    Validators.min(18), // no users under the age of 18
    Validators.max(120)
  ]);
  password = new FormControl('', [
    Validators.required,
    Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm) // Regexr pattern found https://regexr.com/
  ]);
  confirm_password = new FormControl('',[
    Validators.required
  ]);
  phoneNumber = new FormControl('', [
    Validators.required,
    Validators.minLength(9),
    Validators.maxLength(9)
  ]);

  showAlert = false;
  alertMsg = 'Please wait! Your account is being created';
  alertColor = 'blue';
  
  registerForm = new FormGroup({
    name: this.name,
    email: this.email,
    age: this.age,
    password: this.password,
    confirm_password: this.confirm_password,
    phoneNumber: this.phoneNumber
  });

  register(){
    this.showAlert = true;
    this.alertMsg = 'Please wait! Your account is being created';
    this.alertColor = 'blue';
  }

}
