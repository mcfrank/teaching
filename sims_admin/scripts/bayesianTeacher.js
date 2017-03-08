var studentInitialNu = 11;
var numQuestionsPerAssessment = 3;  
var numTimeSteps = 12;
//var numAssessments = 2;
var teacherMus = [.5, .6, .7, .8, .9];
var teacherNu = 10;
var numTeachersArray = [1, 2, 3, 5, 10];
var numAssessmentsArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
var factorials = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600]

// Generate a sequence of student priorAlphas and priorBetas
var generateSequence = function(numStudents, min, max){
  
  return repeat(numStudents, function(){uniformDraw(_.range(min, max))});
}

// Returns numStudents students with true and guessed Alpha and Betas
var generateStudentsArray = function(numStudents){

  //Alphas and betas initially sum to studentInitialNu
  var priorAlphas = generateSequence(numStudents, 1, studentInitialNu - 1);
  var priorBetas = map(function(alpha){
    return studentInitialNu-alpha;
  }, priorAlphas);

  //Guessed alphas and betas are initially set to 1
  var guessAlpha = 1;
  var guessBeta = 1;

  //Generate array of students
  var students = map2(function(priorAlpha, priorBeta){
    //console.log("pA:" + priorAlpha + " | pB: " + priorBeta);
    return {priorAlpha: priorAlpha, priorBeta: priorBeta, guessAlpha: guessAlpha, guessBeta: guessBeta}
  }, priorAlphas, priorBetas);
  

  return students; 
}

// Seeds the guessed params of each student by sampling a Bernoulli variable with the student's true belief as the bias
var assess = function(students, numAssessments){
	var numQuestionsToAsk = numAssessments * numQuestionsPerAssessment;

	var assessedStudents = map(function(student){
		var studentMu = student.priorAlpha / (student.priorAlpha + student.priorBeta);

		//Sample from student's beliefs numQuestionsToAsk times
		var answers = sum(repeat(numQuestionsToAsk, function(){ 
				return flip(studentMu);}
			));

    //Smoothing, in case of extremes
    
    var guessAlpha = answers + 1;
    var guessBeta = numQuestionsToAsk - answers + 1;

		//Seed admin beliefs about student
		return {priorAlpha: student.priorAlpha, priorBeta: student.priorBeta, guessAlpha: guessAlpha, guessBeta: guessBeta};

	}, students);

	return assessedStudents;
}

// Helper function to sort students by true or guessed prior distribution
var sortStudents = function(students, trueValue) {
  //Sort on true alphas/betas
  var trueBetaMeanFn = function(x){return x.priorAlpha / (x.priorAlpha + x.priorBeta + 0.0)};

  //Sort on guessed alphas/betas
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
  
  if (len % N === 0) {
    var size = Math.floor(len / N);
    return [students.slice(0, size)].concat(distributeStudents(students.slice(size), N-1))
  }

  else {
    var size = Math.ceil(len / N);
    return [students.slice(0, size)].concat(distributeStudents(students.slice(size), N-1))
  }
}

// Get the ACTUAL information gain if the teacher chooses the examples they BELIEVE will best improve IG.
var getTeacherIG = function(students, targetParams, numExamples){
  return Infer({method: 'enumerate'}, function(){
    
    //Use this to seed the prior likelihoods of examples
    var target = targetParams.alpha / (targetParams.alpha + targetParams.beta);

    var h = uniformDraw(_.range(0, numExamples + 1));
    var t = numExamples - h;

    //console.log("target params: alpha: " + targetParams.alpha + " ; beta: " + targetParams.beta);

    var believedIGs = map(function(student){
      //console.log("--------");
      //console.log("Student: priorAlpha: " + student.priorAlpha + " ; priorBeta: " + student.priorBeta + " ; guessAlpha: " + student.guessAlpha + " ; guessBeta: " + student.guessBeta);

      //var score = IG2(targetParams.alpha, targetParams.beta, student.guessAlpha, student.guessBeta, h, t)
      ///console.log("Score: " + score);
      //return score;
      return IG2(targetParams.alpha, targetParams.beta, student.guessAlpha, student.guessBeta, h, t);
    }, students)

    var actualIGs = map(function(student){
      return IG2(targetParams.alpha, targetParams.beta, student.priorAlpha, student.priorBeta, h, t);
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
var getAdminIG = function(students, numTeachers, targetParams, numExamples){
  // Array of student distributed into subsets representing numTeachers classrooms
  var distributedStudents = distributeStudents(students, numTeachers);
  
  // Assign teachers to teach each classroom
    var classroomExpectations = map(function(studentsInClassroom){
      var teacherIG = getTeacherIG(studentsInClassroom, targetParams, numExamples);
      return MAP(teacherIG).val;

    }, distributedStudents);

    return classroomExpectations;
}

// Get the information gain if the teacher chooses the examples based on student prior beliefs (i.e. perfect knowledge).
var getTrueTeacherIG = function(students, targetParams, numExamples){
  return Infer({method: 'enumerate'}, function(){
    
    //Use this to seed the prior likelihoods of examples
    var target = targetParams.alpha / (targetParams.alpha + targetParams.beta);

    var h = uniformDraw(_.range(0, numExamples + 1));
    var t = numExamples - h;

    var actualIGs = map(function(student){
      return IG2(targetParams.alpha, targetParams.beta, student.priorAlpha, student.priorBeta, h, t);
    }, students)

    //Weight choice of examples by what teacher believes the IGs will be
    factor(sum(actualIGs));
    
    //Return as the score what the actual IGs will be
    return sum(actualIGs);

  });
}

// Get the total information gain of all students based on prior beliefs
var getTrueAdminIG = function(students, numTeachers, targetParams, numExamples){
  // Array of student distributed into subsets representing numTeachers classrooms
  var distributedStudents = distributeStudents(students, numTeachers);
  
  // Assign teachers to teach each classroom
    var classroomExpectations = map(function(studentsInClassroom){
      var teacherIG = getTrueTeacherIG(studentsInClassroom, targetParams, numExamples);
      return MAP(teacherIG).val;

    }, distributedStudents);

    return classroomExpectations;
}

// Get the information gain if the teacher naive chooses the examples to match the target params (no inference on student beliefs)
// This could be optimized without the Infer statement, but maintained for clarity on equivalent structure
var getNaiveTeacherIG = function(students, targetParams, numExamples){
  return Infer({method: 'forward', samples: 100}, function(){
    //console.log("Naive teacher IG calculating...");

    //Use this to seed the prior likelihoods of examples
    var target = targetParams.alpha / (targetParams.alpha + targetParams.beta);
    
    var h = sum(repeat(numExamples, function(){ flip(target)}));
    //var h = uniformDraw(_.range(0, numExamples + 1));
    var t = numExamples - h;

    var actualIGs = map(function(student){
      return IG2(targetParams.alpha, targetParams.beta, student.priorAlpha, student.priorBeta, h, t);
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
var getNaiveAdminIG = function(students, numTeachers, targetParams, numExamples){
  // Array of student distributed into subsets representing numTeachers classrooms
  var distributedStudents = distributeStudents(students, numTeachers);
  
  // Assign teachers to teach each classroom
    var classroomExpectations = map(function(studentsInClassroom){
      var teacherIG = getNaiveTeacherIG(studentsInClassroom, targetParams, numExamples);
      return MAP(teacherIG).val;

    }, distributedStudents);

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
  var trueSortedStudents = sortStudents(studentsArray, true); // Students sorted on true beliefs, (1,1) guesses

  var numAssessmentsMapping = map(function(numAssessments){


    var assessedStudents = assess(studentsArray, numAssessments); // Unsorted array of students, assessed guesses
    var sortedStudents = sortStudents(assessedStudents, false); // Students sorted on assessment results
    //console.log("*******\n*******\nstudents generated for trial " + trialNum);
    var numExamples = numTimeSteps - numAssessments;

  	//Run simulation for all bias levels
  	var teacherMusMapping = map(function(mu){

  		var teacherAlpha = teacherNu * mu;
  		var teacherBeta = teacherNu - teacherAlpha;
  		var targetParams = {alpha: teacherAlpha, beta: teacherBeta};

      //console.log("-------\ntesting teacher with mu " + mu);

      var numTeachersMapping = map(function(numTeachers){

        // No sorting, naive teachers (teachers show examples proportional to target, without inference on student beliefs)
        var unsortedNaiveIG = sum(getNaiveAdminIG(studentsArray, numTeachers, targetParams, numExamples));

        // No sorting, examples chosen with guessed beliefs
        var unsortedIG = sum(getAdminIG(assessedStudents, numTeachers, targetParams, numExamples));

        // Sorted on guessed student beliefs, examples chosen with guessed beliefs
        var sortedIG = sum(getAdminIG(sortedStudents, numTeachers, targetParams, numExamples));

        // No sorting, examples chosen with true beliefs
        var trueUnsortedIG = sum(getTrueAdminIG(studentsArray, numTeachers, targetParams, numExamples));

        // Sorted on true student beliefs, examples chosen with true beliefs
        var trueSortedIG = sum(getTrueAdminIG(trueSortedStudents, numTeachers, targetParams, numExamples));

        return [{trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, simType: "unsortedNaiveTeachers", IG: unsortedNaiveIG},
        {trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, simType: "unsortedUncertainTeachers", IG: unsortedIG},
        {trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, simType: "sortedUncertainTeachers", IG: sortedIG},
        {trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, simType: "unsortedPerfectTeachers", IG: trueUnsortedIG},
        {trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, simType: "sortedPerfectTeachers", IG: trueSortedIG}];
        
      }, numTeachersArray);

      return numTeachersMapping;
  		
  	}, teacherMus);

    return teacherMusMapping;

  }, numAssessmentsArray);

  return numAssessmentsMapping;

}, 3); // Run 100 trials


multiPluck(_.flatten(results));