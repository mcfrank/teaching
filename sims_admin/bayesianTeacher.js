var studentInitialNu = 11; //Initial sum of studentAlpha + studentBeta parameters
var numQuestionsPerAssessment = 3; //Number of questions asked per assessment period
var numTimeSteps = 12; //Total number of timesteps per simulation
var teacherMus = [.5, .6, .7, .8, .9]; //Possible target concepts tested
var teacherNu = 10; //Initial sum of targetAlpha + targetBeta parameters
var numTeachersArray = [1, 2, 3, 5, 10]; //Possible number of teachers tested
var numAssessmentsArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; //Possible assessments tested
var exponentsArray = [0.8, 0.9, 1, 1.1, 1.2]; //Exponents tested, not used in final thesis


// Generate a sequence of numbers by sampling a uniform distribution, used for generating studentAlphas
var generateSequence = function(numStudents, min, max){
  return repeat(numStudents, function(){uniformDraw(_.range(min, max))});
}

// Returns numStudents students with true and guessed Alpha and Betas
var generateStudentsArray = function(numStudents){

  //Alphas and betas initially sum to studentInitialNu. These are the true alpha and beta parameters for each student.
  var priorAlphas = generateSequence(numStudents, 1, studentInitialNu - 1); //Alphas are generated between 1 and studentInitialNu-1
  var priorBetas = map(function(alpha){return studentInitialNu-alpha;}, priorAlphas); //Betas are calculated from the alphas

  //Guessed alphas and betas are initially set to 1. These are the teachers' guess of what the students' parameters are, initially seeded as 1-1
  var guessAlpha = 1;
  var guessBeta = 1;

  //Generate array of students by consolidating all parameters into a single object.
  var students = map2(function(priorAlpha, priorBeta){

    //Get the DKLs between the student prior distribution and the target distribution for all Mu levels. Calculation occurs at this step because
    //priorDKL never changes regardless of school parameterization and examples shown, so this optimization reduces redundantly repeating this calculation.

    var priorOldDKLs = mapN(function(muIndex){ //This function calculates the prior DKLs for all Mus

      var mu = teacherMus[muIndex]; //Select the mu for this iteration
      var teacherAlpha = teacherNu * mu; //Calcuate alpha value for this mu
      var teacherBeta = teacherNu - teacherAlpha; //Calculate beta value for this mu
      var priorOldDKL = DKL(priorAlpha, priorBeta, teacherAlpha, teacherBeta); //Calculate the DKL using the WebPPL library (must be installed)
      return priorOldDKL;
    }, teacherMus.length);

    return {priorAlpha: priorAlpha, priorBeta: priorBeta, guessAlpha: guessAlpha, guessBeta: guessBeta, priorOldDKLs: priorOldDKLs}; //Return full student object
  }, priorAlphas, priorBetas);


  return students;
}

// Seeds the teacher beliefs (Called guessAlpha and guessBeta) of each student by sampling a Bernoulli variable with the student's true belief as the bias
var assess = function(students, numAssessments){
	var numQuestionsToAsk = numAssessments * numQuestionsPerAssessment; //Calculate number of questions that need to be asked

	var assessedStudents = map(function(student){
		var studentMu = student.priorAlpha / (student.priorAlpha + student.priorBeta); //Calculate student mu from alpha and beta parameters

		//Sample from student's beliefs numQuestionsToAsk times
		var answers = sum(repeat(numQuestionsToAsk, function(){
				return flip(studentMu);} //Stochastically determine answers by flipping a coin weighted equal to student mu.
			));

    //Add-one smoothing, in case of extremes
    var guessAlpha = answers + 1;
    var guessBeta = numQuestionsToAsk - answers + 1;

    //Get the DKLs based on teacher beliefs about student knowledge for all Mu levels
    var guessOldDKLs = mapN(function(muIndex){

      var mu = teacherMus[muIndex];
      var teacherAlpha = teacherNu * mu;
      var teacherBeta = teacherNu - teacherAlpha;
      var guessOldDKL = DKL(guessAlpha, guessBeta, teacherAlpha, teacherBeta);
      return guessOldDKL;
    }, teacherMus.length);

		//Seed admin beliefs about student
		return {priorAlpha: student.priorAlpha, priorBeta: student.priorBeta, guessAlpha: guessAlpha, guessBeta: guessBeta, priorOldDKLs: student.priorOldDKLs, guessOldDKLs: guessOldDKLs}; //Return full student object
	}, students);

	return assessedStudents;
}

// Helper function to sort students by true or guessed prior distribution
var sortStudents = function(students, trueValue) {
  //Sort on true alphas/betas
  var trueBetaMeanFn = function(x){return x.priorAlpha / (x.priorAlpha + x.priorBeta + 0.0)};

  //Sort on teacher beliefs of student knowledge (guessAlpha and guessBeta)
  var guessBetaMeanFn = function(x){return x.guessAlpha / (x.guessAlpha + x.guessBeta + 0.0)};

  if(trueValue){
	  var sortedStudents = sortOn(students, trueBetaMeanFn)

	  return sortedStudents;
	}
	else{
	  var sortedStudents = sortOn(students, guessBetaMeanFn)

	  return sortedStudents;
	}
}

// Helper function to distribute students into N classrooms
var distributeStudents = function(students, N){
  if (N < 2) { return [students]; };

  var len = students.length;

  //Recursive calls to distributeStudents
  if (len % N === 0) {
    //If number of students is perfectly divisble by remaining number of classrooms
    var size = Math.floor(len / N);
    return [students.slice(0, size)].concat(distributeStudents(students.slice(size), N-1))
  }

  else {
    //If number of students is not perfectly divisible by remaining number of classrooms
    var size = Math.ceil(len / N);
    return [students.slice(0, size)].concat(distributeStudents(students.slice(size), N-1))
  }
}

// Get the ACTUAL information gain if the teacher chooses the examples they BELIEVE will best improve IG.
var getTeacherIG = function(students, targetParams, numExamples, exponent){
  return Infer({method: 'enumerate'}, function(){
    //console.log("Getting teacher IG...");

    //Use this to seed the prior likelihoods of examples
    var target = targetParams.alpha / (targetParams.alpha + targetParams.beta);

    var h = uniformDraw(_.range(0, numExamples + 1));
    var t = numExamples - h;

    //console.log("target params: alpha: " + targetParams.alpha + " ; beta: " + targetParams.beta);

    var believedIGs = map(function(student){

      //Retrieve guessOldDKL calculated earlier for this mu
      var oldDKL = student.guessOldDKLs[targetParams.muIndex];

      var newDKL = DKL(student.guessAlpha + h, student.guessBeta + t, targetParams.alpha, targetParams.beta);

      var IG = oldDKL - newDKL;

      return Math.sign(IG) * Math.pow(Math.abs(IG), exponent);
      //return Math.pow(IG2(targetParams.alpha, targetParams.beta, student.guessAlpha, student.guessBeta, h, t), exponent);
    }, students)

    var actualIGs = map(function(student){

      //Retrieve priorOldDKL calculated earlier for this mu
      var oldDKL = student.priorOldDKLs[targetParams.muIndex];

      var newDKL = DKL(student.priorAlpha + h, student.priorBeta + t, targetParams.alpha, targetParams.beta);

      var IG = oldDKL - newDKL;

      return Math.sign(IG) * Math.pow(Math.abs(IG), exponent);
      //return Math.pow(IG2(targetParams.alpha, targetParams.beta, student.priorAlpha, student.priorBeta, h, t), exponent);
    }, students)

    //console.log("Believed IGs: " + believedIGs);
    //console.log("Actual IGs: " + actualIGs);

    //Weight choice of examples by what teacher believes the IGs will be
    factor(sum(believedIGs));

    //Return as the score what the actual IGs will be
    return sum(actualIGs);

  });
}

// Get the total information gain of all students
var getAdminIG = function(students, numTeachers, targetParams, numExamples, exponent){
  // Array of student distributed into subsets representing numTeachers classrooms
  //var distributedStudents = distributeStudents(students, numTeachers);

  // Assign teachers to teach each classroom
    var classroomExpectations = map(function(studentsInClassroom){
      var teacherIG = getTeacherIG(studentsInClassroom, targetParams, numExamples, exponent);
      return MAP(teacherIG).val;

    }, students);
    //}, distributedStudents);

    return classroomExpectations;
}

// Get the information gain if the teacher chooses the examples based on student prior beliefs (i.e. perfect knowledge).
var getTrueTeacherIG = function(students, targetParams, numExamples, exponent){
  return Infer({method: 'enumerate'}, function(){

    //Use this to seed the prior likelihoods of examples
    var target = targetParams.alpha / (targetParams.alpha + targetParams.beta);

    var h = uniformDraw(_.range(0, numExamples + 1));
    var t = numExamples - h;

    var actualIGs = map(function(student){
      var oldDKL = student.priorOldDKLs[targetParams.muIndex];

      var newDKL = DKL(student.priorAlpha + h, student.priorBeta + t, targetParams.alpha, targetParams.beta);

      var IG = oldDKL - newDKL;

      return Math.sign(IG) * Math.pow(Math.abs(IG), exponent);
    }, students);

    //Weight choice of examples by what teacher believes the IGs will be
    factor(sum(actualIGs));

    //Return as the score what the actual IGs will be
    return sum(actualIGs);

  });
}

// Get the total information gain of all students based on prior beliefs
var getTrueAdminIG = function(students, numTeachers, targetParams, numExamples, exponent){
  // Array of student distributed into subsets representing numTeachers classrooms
  //var distributedStudents = distributeStudents(students, numTeachers);

  // Assign teachers to teach each classroom
    var classroomExpectations = map(function(studentsInClassroom){
      var teacherIG = getTrueTeacherIG(studentsInClassroom, targetParams, numExamples, exponent);
      return MAP(teacherIG).val;

    }, students);
    //}, distributedStudents);

    return classroomExpectations;
}

// Get the information gain if the teacher naive chooses the examples to match the target params (no inference on student beliefs)
// This could be optimized without the Infer statement, but maintained for clarity on equivalent structure
var getNaiveTeacherIG = function(students, targetParams, numExamples, exponent){
  return Infer({method: 'forward', samples: 20}, function(){

    //Use this to seed the prior likelihoods of examples
    var target = targetParams.alpha / (targetParams.alpha + targetParams.beta);

    var h = sum(repeat(numExamples, function(){ flip(target)}));
    //var h = uniformDraw(_.range(0, numExamples + 1));
    var t = numExamples - h;

    var actualIGs = map(function(student){
      var oldDKL = student.priorOldDKLs[targetParams.muIndex];

      var newDKL = DKL(student.priorAlpha + h, student.priorBeta + t, targetParams.alpha, targetParams.beta);

      var IG = oldDKL - newDKL;

      return Math.sign(IG) * Math.pow(Math.abs(IG), exponent);
    }, students);

    //Weight choice of examples by what teacher believes the IGs will be, weighted by the numExamples choose h
    // var numExamplesFactorial = factorials[numExamples];
    // var hFactorial = factorials[h];
    // var tFactorial = factorials[t];
    // factor(numExamplesFactorial / (hFactorial * tFactorial) * sum(actualIGs));

    //console.log("Naive teacher IG calculated...");

    //Return as the score what the actual IGs will be
    return sum(actualIGs);
  });
}

// Get the total information gain of all students with naive teachers only picking examples to match the target params (no inference on perfect nor guessed student beliefs)
var getNaiveAdminIG = function(students, numTeachers, targetParams, numExamples, exponent){
  // Array of student distributed into subsets representing numTeachers classrooms
  //var distributedStudents = distributeStudents(students, numTeachers);

  // Assign teachers to teach each classroom
    var classroomExpectations = map(function(studentsInClassroom){
      var teacherIG = getNaiveTeacherIG(studentsInClassroom, targetParams, numExamples, exponent);
      return MAP(teacherIG).val;
    }, students);
    //}, distributedStudents);

    return classroomExpectations;

}

// Helper function to convert an array of objects with shared keys to an object of arrays with same keys
// ----------
// Sample input: [{keyA: A1, keyB: B1, keyC: C1}, {keyA: A2, keyB: B2, keyC: C2}]
// Sample output: {keyA: [A1, A2], keyB: [B1, B2], keyC: [C1, C2]}
var multiPluck = function(objectArray){
  //Extract the keys from the first object in the array
  var keys = _.keys(objectArray[0]);

  //Perform a pluck on each key
  var valueArrays = map(function(key){
    return _.pluck(objectArray, key);
  }, keys);

  //Attach keys to the respective value arrays
  var outputObject = _.object(keys, valueArrays);

  return outputObject
}

var results = mapN(function(trialNum){

  console.log("Starting trial " + trialNum);

	var studentsArray = generateStudentsArray(100); // Unsorted array of students, (1,1) guesses
  // Do distribution of studentsArray once across all parameterizations of assessments and mus.
  var studentsArray_rosters_byNumTeachers = map(function(numTeachers){
    return distributeStudents(studentsArray, numTeachers);
  }, numTeachersArray);

  var trueSortedStudents = sortStudents(studentsArray, true); // Students sorted on true beliefs, (1,1) guesses
  // Do distribution of trueSortedStudents once across all parameterizations of assessments and mus.
  var trueSortedStudents_rosters_byNumTeachers = map(function(numTeachers){
    return distributeStudents(trueSortedStudents, numTeachers);
  }, numTeachersArray);

  var numAssessmentsMapping = map(function(numAssessments){
    console.log("Assessing: " + numAssessments);


    var assessedStudents = assess(studentsArray, numAssessments); // Unsorted array of students, assessed guesses
    // Do distribution of assessedStudents once across all parameterizations of mus.
    var assessedStudents_rosters_byNumTeachers = map(function(numTeachers){
      return distributeStudents(assessedStudents, numTeachers);
    }, numTeachersArray);

    var sortedStudents = sortStudents(assessedStudents, false); // Students sorted on assessment results
    // Do distribution of sortedStudents once across all parameterizations of mus.
    var sortedStudents_rosters_byNumTeachers = map(function(numTeachers){
      return distributeStudents(sortedStudents, numTeachers);
    }, numTeachersArray);

    var numExamples = numTimeSteps - numAssessments;

  	//Run simulation for all bias levels
  	var teacherMusMapping = mapN(function(muIndex){
      var mu = teacherMus[muIndex];
  		var teacherAlpha = teacherNu * mu;
  		var teacherBeta = teacherNu - teacherAlpha;
  		var targetParams = {alpha: teacherAlpha, beta: teacherBeta, muIndex: muIndex};

      //console.log("-------\ntesting teacher with mu " + mu);

      var numTeachersMapping = mapN(function(i){
        var numTeachers = numTeachersArray[i]; // Get number of teachers at index i
        var studentsArray_roster = studentsArray_rosters_byNumTeachers[i]; //Get distribution of studentsArray for this number of teachers, which is at index i
        var assessedStudents_roster = assessedStudents_rosters_byNumTeachers[i];
        var sortedStudents_roster = sortedStudents_rosters_byNumTeachers[i];
        var trueSortedStudents_roster = trueSortedStudents_rosters_byNumTeachers[i];

        var exponentsMapping = map(function(exponent){
          // No sorting, naive teachers (teachers show examples proportional to target, without inference on student beliefs)
          var unsortedNaiveIG = sum(getNaiveAdminIG(studentsArray_roster, numTeachers, targetParams, numExamples, exponent));

          // No sorting, examples chosen with guessed beliefs
          var unsortedIG = sum(getAdminIG(assessedStudents_roster, numTeachers, targetParams, numExamples, exponent));

          // Sorted on guessed student beliefs, examples chosen with guessed beliefs
          var sortedIG = sum(getAdminIG(sortedStudents_roster, numTeachers, targetParams, numExamples, exponent));

          // No sorting, examples chosen with true beliefs
          var trueUnsortedIG = sum(getTrueAdminIG(studentsArray_roster, numTeachers, targetParams, numExamples, exponent));

          // Sorted on true student beliefs, examples chosen with true beliefs
          var trueSortedIG = sum(getTrueAdminIG(trueSortedStudents_roster, numTeachers, targetParams, numExamples, exponent));

          return [{trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, exponent: exponent, simType: "unsortedNaiveTeachers", IG: unsortedNaiveIG},
          {trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, exponent: exponent, simType: "unsortedUncertainTeachers", IG: unsortedIG},
          {trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, exponent: exponent, simType: "sortedUncertainTeachers", IG: sortedIG},
          {trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, exponent: exponent, simType: "unsortedPerfectTeachers", IG: trueUnsortedIG},
          {trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, exponent: exponent, simType: "sortedPerfectTeachers", IG: trueSortedIG}];

        }, exponentsArray);

        return exponentsMapping;
      }, numTeachersArray.length);

      return numTeachersMapping;

  	}, teacherMus.length);

    return teacherMusMapping;

  }, numAssessmentsArray);

  return numAssessmentsMapping;

}, 100); // Number of trials to run


multiPluck(_.flatten(results));
