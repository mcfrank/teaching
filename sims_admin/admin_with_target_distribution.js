// WebPPL notes
// observe(Dist, val) === factor(Dist.score(val))
// condition(x === y) === factor( x === y ? 0 : -Infinity)

var costPerTeacher = 10;

var admin = function(targetParams, budget, students) {
  return Infer({method: 'enumerate'}, function(){
    // Do not allow more than total number of students' number of teachers
    var maxTeachers = Math.min(students.length, Math.floor(budget/costPerTeacher));
    
    // Draw a random number of teachers within the budget to simulate a school
    var numTeachers = uniformDraw(_.range(1, maxTeachers + 1));
    
    // Sort students by their prior beliefs' distributional means
    var sortedStudents = sortStudents(students);

    // Array of student distributed into subsets representing numTeachers classrooms
    var distributedStudents = distributeStudents(sortedStudents, numTeachers);
    
    print(distributedStudents)
    
    // Assign teachers to teach each classroom
    var classroomExpectations = map(function(studentsInClassroom){
    
      var teacherScore = getTeacherScore(targetParams, studentsInClassroom);
  //       print("break1")
        viz.hist(teacherScore)
  //       print(mapObject(function(propName, value){
  //         return 
  //       }, teacherScore))
  //       print(teacherScore)
        print(MAP(teacherScore))
        print("break2")
  //    return getTeacherScore(target, studentsInClassroom);
  //       return expectation(teacherScore);
        return MAP(teacherScore).val;

    }, distributedStudents);
    
    // Argmax version, as opposed to expected value
//     var classroomMaxScores = map(function(classroomDist){
//       classroomDist.support
//       return Math.max(classroomDist.support);
//     }, classroomDists);
    
//     print(classroomMaxScores)
    
    factor(sum(classroomExpectations));

    return numTeachers
  })

}

// Helper function to calculate information gain using analytic form:
var informationGain = function(targetAlpha, targetBeta, studentAlpha, studentBeta){
  return Math.log((studentAlpha + studentBeta) / studentAlpha) + digamma(targetAlpha) + digamma(targetAlpha + targetBeta);
}

// A version of teacher method that returns the scores
var getTeacherScore = function(targetParams, students) { 
  return Infer({method: 'enumerate'}, function(){

    var example = repeat(7, flip);

    // Calculate mean value of target distribution using analytical form
    var target = targetParams.alpha / (targetParams.alpha + targetParams.beta);

    // All students are in this scope
    // var learnerPosteriors = map(function(student){
      
    //   // Individual students in this scope
    //   return learnerDist(student.priorAlpha, student.priorBeta, example);
    
    // }, students);
    
    // Stochastic generation of posteriors, not using closed form
    //map(function(learnerPost){ observe(learnerPost, target) }, learnerPosteriors)
    
    // Score using log probabilities
    // var scores = map(function(currPosterior){
    //   return currPosterior.score(target);
    // }, learnerPosteriors)

    // Score is the information gain formula, so no inference is necessary with knowledge of the student
    var scores = map(function(currStudent){
      return informationGain(targetParams.alpha, targetParams.beta, currStudent.priorAlpha, currStudent.priorBeta);
    }, students)
    
    print(scores)
    
    factor(sum(scores));
    
    return sum(scores);

  });
  
}

//Returns student posterior distribution
var learnerDist = function(priorAlpha, priorBeta, example){
  
  var numTrues = sum(example)//reduce(addTrues, 0, example);
  
  var postAlpha = priorAlpha + numTrues //Number of trues
  
  var postBeta = priorBeta + example.length - numTrues //Number of falses
  
  return Beta({a: postAlpha, b: postBeta})
}


// Helper function to sort students by prior distribution mean
var sortStudents = function(students) {

  var betaMeanFn = function(x){return x.priorAlpha / (x.priorAlpha + x.priorBeta + 0.0)};
  
  var sortedStudents = sortOn(students, betaMeanFn)
  
  return sortedStudents;
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

var teacher = function(target, students) {
  return Infer({method: 'enumerate'}, function() {
    var example = repeat(7, flip);
    
    //var utility = learnerDist(studentInitialAlpha, studentInitialBeta, [example]);
    //var utility2 = learnerDist(3, 1, [example]);
    
    var learnerPosteriors = map2(function(priorAlpha, priorBeta){
      return learnerDist(priorAlpha, priorBeta, example);
    }, students.priorAlphas, students.priorBetas);
    
    
    map(function(learnerPost){ observe(learnerPost, target) }, 
       learnerPosteriors)
    
    // observe(Dist, val) === factor(Dist.score(val))
    // condition(x === y) === factor( x === y ? 0 : -Infinity)
    
    var scores = map(function(currUtility){
      return currUtility.score(target);
    }, utilities)
    
    factor(sum(scores));
    
    return sum(example);
  });
};

// Helper function to generate a sequence of student priorAlphas and priorBetas
var generateSequence = function(numStudents, min, max){
  return repeat(numStudents, function(){uniformDraw(_.range(1,10))})
}

// Wrapper function to return an array of objects, each that represent a student and contains priorAlpha and priorBeta properties. Object of [{priorAlpha, priorBeta}, ...] form
var generateStudentsArray = function(numStudents){
  var priorAlphas = generateSequence(numStudents, 1, 10);
  var priorBetas = generateSequence(numStudents, 1, 10);
  
  // Calculate the beliefs as a function of 
  var students = map2(function(priorAlpha, priorBeta){
    return {priorAlpha: priorAlpha, priorBeta: priorBeta}
  }, priorAlphas, priorBetas)

   return students; 
}

//Wrapper function to return a dictionary of arrays representing prior alphas and prior betas
var generateStudents = function(numStudents){
   return {priorAlphas: generateSequence(numStudents, 1, 10), priorBetas: generateSequence(numStudents, 1, 10)}; 
}

// Wrapper function to return a dictionary of arrays representing student priorAlphas and priorBetas. Object of {priorAlphas: [], priorBetas: []} form
var generateStudents = function(numStudents){
  var priorAlphas = generateSequence(numStudents, 1, 10);
  var priorBetas = generateSequence(numStudents, 1, 10);
  
  // Calculate the beliefs as a function of 
  var students = map2(function(priorAlpha, priorBeta){
    return {priorAlpha: priorAlpha, priorBeta: priorBeta}
  }, priorAlphas, priorBetas)
  
   return {priorAlphas: generateSequence(numStudents, 1, 10), priorBetas: generateSequence(numStudents, 1, 10)}; 
}

var generateTargetParams = function(){
  return {alpha: uniformDraw(_.range(1,10)), beta: uniformDraw(_.range(1,10))};
}

//var students = generateStudents(10);
//viz(students.priorAlphas)
//viz(students.priorBetas)
//var inference = teacher(0.3, students);
//viz(inference)

var studentsArray = generateStudentsArray(2);
print(studentsArray)
// var inference = getTeacherScore(0.3, studentsArray);
// print(inference)

var targetParams = generateTargetParams();
print("Alpha: " + targetParams.alpha + " | Beta: " + targetParams.beta + " | Mean: " + targetParams.alpha / (targetParams.alpha + targetParams.beta));

var sortedStudents = sortStudents(studentsArray);
var inference = admin(targetParams, 100, sortedStudents)
viz(inference)