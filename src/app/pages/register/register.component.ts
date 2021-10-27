import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import firebase from "firebase/app";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  form!: FormGroup;
  grades: any[] = ['A-Levels', 'O-Levels'];
  countries: any[] = [];
  step: number = 1;

  useSameNumber: boolean = false;
  // whatsappNumber: any;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private fb: FormBuilder,
    private http: HttpClient,
    private ngxLoader: NgxUiLoaderService
  ) { }

  ngOnInit(): void {
    this.getCountries();
  }

  async getCountries(): Promise<any> {
    try {

      let res: any = await this.http.get('https://restcountries.com/v2/all').toPromise();
      this.countries = <any[]>res.map((country: any) => country.name);
      // debugger

    } catch (error) {
      console.log(error)
    }
  }

  initForm(userData: any) {
    this.form = this.fb.group({
      uid: userData.uid,
      fullName: userData.fullName,
      email: userData.email,
      grade: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      whatsappNumber: ['', Validators.required],
      country: ['', Validators.required],
      // plan: ['', Validators.required],
    })

    this.step = 2;
  }

  async googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    let userData: any;

    try {
      const credential = await this.afAuth.signInWithPopup(provider);
      this.ngxLoader.start();
      debugger

      // prepare userData to be saved in firestore document
      userData = {
        fullName: credential.user!.displayName,
        email: credential.user!.email,
        uid: credential.user!.uid
      }

      this.initForm(userData);

    } catch (error) {
      console.log(error)

    } finally {
      this.ngxLoader.stop();
    }

    // this.updateUserData(credential.user);
  }

  async isAlreadyRegistered(docId: string) {

    try {
      let document = this.afs.collection('newUsers').doc(docId).ref.get();

      if ((await document).exists)
        return true;
      // console.log(doc.data());
      else
        return false

    } catch (error) {
      console.log(error);
      throw error;
    }

  }

  createUserObject(formData: any) {
    return {
      id: formData.uid,
      fullName: formData.fullName,
      fCMToken: "",
      logggedInSessionId: "",
      email: formData.email,
      grade: formData.grade,
      phoneNumber: formData.phoneNumber,
      whatsappNumber: formData.whatsappNumber,
      country: formData.country,
      expireTime: null,
      isApproved: false,
      isIndividual: false,
      isPaid: false,
      plan: 'free',
      progress: [],
      sessionsIDs: [],
      videos: []
    }
  }

  async registerUser() {
    this.ngxLoader.start();
    let formData: any = this.form.value;

    try {

      if (await this.isAlreadyRegistered(formData.email)) {
        this.step = 4;

      } else {
        // create user object - following the newUsers schema:
        let newUser = this.createUserObject(formData);
        debugger
        await this.afs.collection("newUsers").doc(formData.email).set(newUser);
        this.step = 3;

      }

    } catch (error) {
      console.log(error)
    } finally {

      this.ngxLoader.stop();
    }
    // const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.email}`)
  }

  setWhatsappNumber(e: any) {
    debugger
    switch (e.currentTarget.checked) {
      case true:
        this.form.patchValue({
          whatsappNumber: this.form.value.phoneNumber
        })
        this.useSameNumber = true;
        break;

      case false:
        this.form.patchValue({
          whatsappNumber: ''
        })
        this.useSameNumber = false;
        break;

      default:
        break;
    }

  }
}
